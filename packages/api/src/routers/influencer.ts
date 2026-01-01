/**
 * ============================================================================
 * INFLUENCER ROUTER
 * ============================================================================
 * CRUD operations pour les influenceurs
 */

import { db } from "@app/db";
import { influencer, post } from "@app/db/schema";
import { protectedProcedure, router } from "../index";
import { z } from "zod";
import { eq, desc, count } from "drizzle-orm";

export const influencerRouter = router({
  /**
   * Liste tous les influenceurs
   */
  list: protectedProcedure.query(async () => {
    const influencers = await db
      .select({
        id: influencer.id,
        username: influencer.username,
        fullName: influencer.fullName,
        followers: influencer.followers,
        postsCount: influencer.postsCount,
        profilePicUrl: influencer.profilePicUrl,
        isVerified: influencer.isVerified,
        createdAt: influencer.createdAt,
      })
      .from(influencer)
      .orderBy(desc(influencer.followers));

    return influencers;
  }),

  /**
   * Récupère un influenceur avec stats
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [influencerData] = await db
        .select()
        .from(influencer)
        .where(eq(influencer.id, input.id))
        .limit(1);

      if (!influencerData) {
        throw new Error("Influencer not found");
      }

      // Compter les posts
      const [postsStats] = await db
        .select({ count: count() })
        .from(post)
        .where(eq(post.influencerId, input.id));

      // Compter les posts avec coauthors (partnerships)
      const postsWithCoauthors = await db
        .select({ count: count() })
        .from(post)
        .where(eq(post.influencerId, input.id))
        .execute();

      return {
        ...influencerData,
        stats: {
          totalPosts: postsStats?.count || 0,
          partnerships: postsWithCoauthors?.[0]?.count || 0,
        },
      };
    }),

  /**
   * Supprime un influenceur (cascade delete posts)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(influencer).where(eq(influencer.id, input.id));
      return { success: true };
    }),
});
