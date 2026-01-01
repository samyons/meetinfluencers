import { db } from "@app/db";
import { post, influencer } from "@app/db/schema";
import { protectedProcedure, router } from "../index";
import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";

export const postRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        influencerId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions = input.influencerId
        ? eq(post.influencerId, input.influencerId)
        : undefined;

      const posts = await db
        .select()
        .from(post)
        .where(conditions)
        .orderBy(desc(post.date))
        .limit(input.limit)
        .offset(input.offset);

      return posts;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [result] = await db
        .select()
        .from(post)
        .where(eq(post.id, input.id))
        .limit(1);

      if (!result) {
        throw new Error("Post not found");
      }

      return result;
    }),
});
