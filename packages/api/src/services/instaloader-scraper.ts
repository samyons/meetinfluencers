/**
 * ============================================================================
 * TYPESCRIPT SCRAPER SERVICE - Using instaloader-ts
 * ============================================================================
 * Remplace l'API Python FastAPI par instaloader-ts natif
 */

import { Instaloader, isErr, isSome, type Post, type Profile } from "instaloader-ts";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export interface ScrapeRequest {
  username: string;
  dateFrom?: Date;
  dateTo?: Date;
  sessionUsername?: string;
  onLog?: (message: string) => void;
}

export interface ProfileData {
  username: string;
  full_name: string;
  bio: string | null;
  followers: number | null;
  following: number | null;
  posts_count: number | null;
  profile_pic_url: string | null;
  is_verified: boolean | null;
  is_business: boolean | null;
}

export interface PostData {
  shortcode: string;
  url: string;
  caption: string | null;
  date: Date | null;
  is_video: boolean;
  tagged_users: string[];
  caption_mentions: string[];
  coauthors: string[];
  is_sponsored: boolean;
  sponsor_users: string[];
}

export interface ScrapeResponse {
  success: boolean;
  data?: {
    profile: ProfileData;
    posts: PostData[];
  };
  error?: string;
}

function getSessionPath(username: string): string {
  const configDir = process.env["XDG_CONFIG_HOME"] ?? join(homedir(), ".config");
  return join(configDir, "instaloader", `session-${username}`);
}

async function loadSessionFromFile(username: string) {
  try {
    const sessionPath = getSessionPath(username);
    const data = await readFile(sessionPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function extractProfileData(profile: Profile): ProfileData {
  return {
    username: profile.username,
    full_name: isSome(profile.fullName) ? profile.fullName.value : "",
    bio: isSome(profile.biography) ? profile.biography.value : null,
    followers: isSome(profile.followers) ? profile.followers.value : null,
    following: isSome(profile.followees) ? profile.followees.value : null,
    posts_count: isSome(profile.mediacount) ? profile.mediacount.value : null,
    profile_pic_url: isSome(profile.profilePicUrl) ? profile.profilePicUrl.value : null,
    is_verified: isSome(profile.isVerified) ? profile.isVerified.value : null,
    is_business: isSome(profile.isBusinessAccount) ? profile.isBusinessAccount.value : null,
  };
}

async function extractPostData(post: Post): Promise<PostData> {
  const partnershipHashtags = ["ad", "sponsored", "pub", "partenariat", "collab"];
  const hasPartnershipHashtag = post.captionHashtags.some((tag) =>
    partnershipHashtags.includes(tag.toLowerCase())
  );

  const ownerUsername = isSome(post.ownerUsername) ? post.ownerUsername.value : "";
  const brandMentions = post.captionMentions.filter((mention) =>
    mention !== ownerUsername
  );

  const url = post.url || `https://www.instagram.com/p/${post.shortcode}/`;

  const coauthorProfiles = await post.getCoauthorProducers();
  const coauthors = coauthorProfiles
    .map((profile) => profile.username)
    .filter((username): username is string => username !== null && username !== "");

  return {
    shortcode: post.shortcode,
    url,
    caption: post.caption,
    date: isSome(post.dateUtc) ? post.dateUtc.value : null,
    is_video: post.isVideo,
    tagged_users: post.taggedUsers,
    caption_mentions: post.captionMentions,
    coauthors,
    is_sponsored: post.isSponsored || hasPartnershipHashtag,
    sponsor_users: brandMentions,
  };
}

export class InstaloaderTsService {
  private loader: Instaloader | null = null;

  async initialize() {
    const result = await Instaloader.create({
      quiet: true,
      sleep: true,
      iphoneSupport: true,
    });

    if (isErr(result)) {
      throw new Error("Failed to create Instaloader instance");
    }

    this.loader = result.value;
  }

  async loadSession(sessionUsername: string) {
    if (!this.loader) throw new Error("Loader not initialized");

    const sessionData = await loadSessionFromFile(sessionUsername);
    if (sessionData) {
      const result = await this.loader.loadSessionData(sessionUsername, sessionData);
      if (isErr(result)) {
        console.warn("Failed to load session, continuing without auth");
      }
    }
  }

  async scrapeInfluencer(request: ScrapeRequest): Promise<ScrapeResponse> {
    const log = (msg: string) => {
      console.log(msg);
      request.onLog?.(msg);
    };

    try {
      if (!this.loader) {
        await this.initialize();
      }

      if (request.sessionUsername) {
        log(`[Scraper] Loading session for ${request.sessionUsername}...`);
        await this.loadSession(request.sessionUsername);
      }

      log(`[Scraper] Getting profile for ${request.username}...`);
      const profileResult = await this.loader!.getProfile(request.username);
      if (isErr(profileResult)) {
        const errorTag = profileResult.error?._tag || "UnknownError";
        console.error(`[Scraper] Profile error:`, profileResult.error);
        return {
          success: false,
          error: `Profile not found: ${errorTag}`,
        };
      }

      const profile = profileResult.value;
      const profileData = extractProfileData(profile);
      log(`[Scraper] Profile retrieved: ${profileData.full_name} (@${profileData.username})`);
      log(`[Scraper] Fetching posts...`);
      
      const posts: PostData[] = [];
      let postCount = 0;
      let errorCount = 0;
      let skippedPinned = 0;
      let consecutiveOutOfRange = 0;

      for await (const postResult of profile.getPosts()) {
        if (isErr(postResult)) {
          errorCount++;
          const error = postResult.error;
          const errorTag = error?._tag || error?.constructor?.name || "UnknownError";
          const errorMessage = error?.message || String(error);
          console.error(`[Scraper] Post error #${errorCount}: ${errorTag} - ${errorMessage}`);
          
          if (errorMessage.includes("undefined is not an object") || 
              errorMessage.includes("d.data.user") ||
              errorTag === "LoginRequiredError") {
            console.error(`[Scraper] Authentication required to fetch posts. Use sessionUsername parameter.`);
            return {
              success: false,
              error: "Authentification requise pour récupérer les posts. Veuillez configurer une session Instagram (voir README).",
            };
          }
          
          if (errorCount >= 3) {
            console.error(`[Scraper] Too many consecutive errors, stopping`);
            break;
          }
          continue;
        }

        errorCount = 0;
        postCount++;

        const post = postResult.value;
        const postDate = isSome(post.dateUtc) ? post.dateUtc.value : null;

        if (post.isPinned) {
          skippedPinned++;
          log(`[Scraper] Skipping pinned post #${postCount}: ${post.shortcode}`);
          continue;
        }

        log(`[Scraper] Post #${postCount}: ${post.shortcode} (${postDate?.toISOString() || 'no date'})`);

        if (request.dateTo && postDate && postDate > request.dateTo) {
          consecutiveOutOfRange++;
          log(`[Scraper] Post is after dateTo (${consecutiveOutOfRange} consecutive)`);
          
          if (consecutiveOutOfRange >= 4) {
            log(`[Scraper] 4 consecutive posts after dateTo, stopping`);
            break;
          }
          continue;
        }

        if (request.dateFrom && postDate && postDate < request.dateFrom) {
          consecutiveOutOfRange++;
          log(`[Scraper] Post is before dateFrom (${consecutiveOutOfRange} consecutive)`);
          
          if (consecutiveOutOfRange >= 4) {
            log(`[Scraper] 4 consecutive posts before dateFrom, stopping`);
            break;
          }
          continue;
        }

        consecutiveOutOfRange = 0;
        posts.push(await extractPostData(post));
        
        if (posts.length >= 100) {
          log(`[Scraper] Reached 100 posts limit`);
          break;
        }
      }

      if (skippedPinned > 0) {
        log(`[Scraper] Skipped ${skippedPinned} pinned post(s)`);
      }
      log(`[Scraper] Done! Scraped ${posts.length} posts`);

      return {
        success: true,
        data: {
          profile: profileData,
          posts,
        },
      };
    } catch (error) {
      console.error(`[Scraper] Unexpected error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const instaloaderService = new InstaloaderTsService();
