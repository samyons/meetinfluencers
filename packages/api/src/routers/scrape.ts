/**
 * ============================================================================
 * SCRAPE ROUTER
 * ============================================================================
 * Lance le scraping et sauvegarde en BDD
 */

import { db } from "@app/db";
import { influencer, post, scrapeLog } from "@app/db/schema";
import { protectedProcedure, router } from "../index";
import { instaloaderService } from "../services/instaloader-scraper";
import { scrapeEvents } from "../services/scrape-events";
import { z } from "zod";

export const scrapeRouter = router({
  /**
   * Vérifie que le service est prêt
   */
  healthCheck: protectedProcedure.query(async () => {
    return { healthy: true };
  }),

  /**
   * Lance le scraping d'un influenceur
   */
  scrapeInfluencer: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        sessionId: z.string(),
        sessionUsername: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { sessionId, username, dateFrom, dateTo, sessionUsername } = input;

      try {
        scrapeEvents.emit(sessionId, {
          type: "start",
          message: `Starting scrape for @${username}...`,
        });

        scrapeEvents.emit(sessionId, {
          type: "progress",
          message: "Initializing scraper...",
        });

        let dateToAdjusted: Date | undefined;
        if (dateTo) {
          dateToAdjusted = new Date(dateTo);
          dateToAdjusted.setHours(23, 59, 59, 999);
        }

        const result = await instaloaderService.scrapeInfluencer({
          username,
          dateFrom: dateFrom ? new Date(dateFrom) : undefined,
          dateTo: dateToAdjusted,
          sessionUsername,
          onLog: (message) => {
            scrapeEvents.emit(sessionId, {
              type: "progress",
              message,
            });
          },
        });

        if (!result.success || !result.data) {
          throw new Error(result.error || "Scraping failed");
        }

        const { profile, posts } = result.data;

        scrapeEvents.emit(sessionId, {
          type: "progress",
          message: `Profile retrieved: ${profile.full_name} (@${profile.username})`,
          data: { totalPosts: posts.length },
        });

        const influencerId = `influencer_${profile.username}`;

        scrapeEvents.emit(sessionId, {
          type: "progress",
          message: "Saving influencer profile to database...",
        });

        await db
          .insert(influencer)
          .values({
            id: influencerId,
            username: profile.username,
            fullName: profile.full_name,
            bio: profile.bio,
            followers: profile.followers ?? 0,
            following: profile.following ?? 0,
            postsCount: profile.posts_count ?? 0,
            profilePicUrl: profile.profile_pic_url,
            isVerified: profile.is_verified ?? false,
            isBusiness: profile.is_business ?? false,
          })
          .onConflictDoUpdate({
            target: influencer.username,
            set: {
              fullName: profile.full_name,
              bio: profile.bio,
              followers: profile.followers ?? 0,
              following: profile.following ?? 0,
              postsCount: profile.posts_count ?? 0,
              profilePicUrl: profile.profile_pic_url,
              isVerified: profile.is_verified ?? false,
              isBusiness: profile.is_business ?? false,
              updatedAt: new Date(),
            },
          });

        scrapeEvents.emit(sessionId, {
          type: "progress",
          message: `Saving ${posts.length} posts...`,
        });

        for (let i = 0; i < posts.length; i++) {
          const postData = posts[i]!;
          await db
            .insert(post)
            .values({
              id: `post_${postData.shortcode}`,
              influencerId,
              shortcode: postData.shortcode,
              url: postData.url,
              caption: postData.caption,
              date: postData.date ?? new Date(),
              isVideo: postData.is_video,
              taggedUsers: postData.tagged_users,
              captionMentions: postData.caption_mentions,
              coauthors: postData.coauthors,
              isSponsored: postData.is_sponsored,
              sponsorUsers: postData.sponsor_users,
            })
            .onConflictDoNothing();

          if ((i + 1) % 10 === 0 || i === posts.length - 1) {
            scrapeEvents.emit(sessionId, {
              type: "progress",
              message: `Saved ${i + 1}/${posts.length} posts`,
              data: {
                postsScraped: i + 1,
                totalPosts: posts.length,
              },
            });
          }
        }

        await db.insert(scrapeLog).values({
          id: `log_${Date.now()}`,
          influencerId,
          dateFrom: dateFrom ? new Date(dateFrom) : new Date(),
          dateTo: dateTo ? new Date(dateTo) : new Date(),
          postsCount: posts.length,
          status: "success",
        });

        scrapeEvents.emit(sessionId, {
          type: "success",
          message: `✅ Successfully scraped ${posts.length} posts!`,
          data: { postsScraped: posts.length },
        });

        return {
          success: true,
          influencerId,
          postsScraped: posts.length,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        scrapeEvents.emit(sessionId, {
          type: "error",
          message: `❌ Error: ${errorMessage}`,
        });

        throw error;
      }
    }),
});
