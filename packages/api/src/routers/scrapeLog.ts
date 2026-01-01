/**
 * ============================================================================
 * SCRAPE LOG ROUTER
 * ============================================================================
 * Historique des scrapes
 */

import { db } from "@app/db";
import { scrapeLog, influencer } from "@app/db/schema";
import { protectedProcedure, router } from "../index";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";

export const scrapeLogRouter = router({
  /**
   * Liste tous les logs de scrape avec infos influencer
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const { limit = 50, offset = 0 } = input || {};

      const logs = await db
        .select({
          id: scrapeLog.id,
          scrapedAt: scrapeLog.scrapedAt,
          dateFrom: scrapeLog.dateFrom,
          dateTo: scrapeLog.dateTo,
          postsCount: scrapeLog.postsCount,
          status: scrapeLog.status,
          errorMessage: scrapeLog.errorMessage,
          influencerId: scrapeLog.influencerId,
          influencerUsername: influencer.username,
          influencerFullName: influencer.fullName,
          influencerProfilePic: influencer.profilePicUrl,
        })
        .from(scrapeLog)
        .leftJoin(influencer, eq(scrapeLog.influencerId, influencer.id))
        .orderBy(desc(scrapeLog.scrapedAt))
        .limit(limit)
        .offset(offset);

      return logs;
    }),

  /**
   * Liste les logs pour un influencer spécifique
   */
  getByInfluencer: protectedProcedure
    .input(z.object({ influencerId: z.string() }))
    .query(async ({ input }) => {
      const logs = await db
        .select()
        .from(scrapeLog)
        .where(eq(scrapeLog.influencerId, input.influencerId))
        .orderBy(desc(scrapeLog.scrapedAt));

      return logs;
    }),
});
