/**
 * ============================================================================
 * MEETINFLUENCERS - DATABASE SCHEMA
 * ============================================================================
 * Schema pour influenceurs et posts Instagram
 */

import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// ============================================================================
// INFLUENCERS
// ============================================================================

export const influencer = sqliteTable(
  "influencer",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    fullName: text("full_name").notNull(),
    bio: text("bio"),
    followers: integer("followers").notNull(),
    following: integer("following").notNull(),
    postsCount: integer("posts_count").notNull(),
    profilePicUrl: text("profile_pic_url"),
    isVerified: integer("is_verified", { mode: "boolean" }).default(false).notNull(),
    isBusiness: integer("is_business", { mode: "boolean" }).default(false).notNull(),
    
    // Metadata
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("influencer_username_idx").on(table.username)]
);

// ============================================================================
// POSTS
// ============================================================================

export const post = sqliteTable(
  "post",
  {
    id: text("id").primaryKey(),
    influencerId: text("influencer_id")
      .notNull()
      .references(() => influencer.id, { onDelete: "cascade" }),
    
    // Instagram data
    shortcode: text("shortcode").notNull().unique(),
    url: text("url").notNull(),
    caption: text("caption"),
    date: integer("date", { mode: "timestamp_ms" }).notNull(),
    isVideo: integer("is_video", { mode: "boolean" }).default(false).notNull(),
    
    // JSON fields (arrays stockés en JSON)
    taggedUsers: text("tagged_users", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
    captionMentions: text("caption_mentions", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
    coauthors: text("coauthors", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
    
    // Sponsorship data
    isSponsored: integer("is_sponsored", { mode: "boolean" }).default(false).notNull(),
    sponsorUsers: text("sponsor_users", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
    
    // Metadata
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("post_influencer_idx").on(table.influencerId),
    index("post_shortcode_idx").on(table.shortcode),
    index("post_date_idx").on(table.date),
  ]
);

// ============================================================================
// SCRAPE LOGS
// ============================================================================

export const scrapeLog = sqliteTable(
  "scrape_log",
  {
    id: text("id").primaryKey(),
    influencerId: text("influencer_id")
      .notNull()
      .references(() => influencer.id, { onDelete: "cascade" }),
    
    scrapedAt: integer("scraped_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    dateFrom: integer("date_from", { mode: "timestamp_ms" }).notNull(),
    dateTo: integer("date_to", { mode: "timestamp_ms" }).notNull(),
    postsCount: integer("posts_count").notNull(),
    
    // Status + erreurs
    status: text("status", { enum: ["success", "partial", "failed"] }).notNull(),
    errorMessage: text("error_message"),
  },
  (table) => [
    index("scrape_log_influencer_idx").on(table.influencerId),
    index("scrape_log_scraped_at_idx").on(table.scrapedAt),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const influencerRelations = relations(influencer, ({ many }) => ({
  posts: many(post),
  scrapeLogs: many(scrapeLog),
}));

export const postRelations = relations(post, ({ one }) => ({
  influencer: one(influencer, {
    fields: [post.influencerId],
    references: [influencer.id],
  }),
}));

export const scrapeLogRelations = relations(scrapeLog, ({ one }) => ({
  influencer: one(influencer, {
    fields: [scrapeLog.influencerId],
    references: [influencer.id],
  }),
}));
