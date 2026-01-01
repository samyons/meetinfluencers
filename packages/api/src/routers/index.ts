import { publicProcedure, router } from "../index";
import { influencerRouter } from "./influencer";
import { postRouter } from "./post";
import { scrapeRouter } from "./scrape";
import { scrapeLogRouter } from "./scrapeLog";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),

  // MeetInfluencers routes
  influencer: influencerRouter,
  post: postRouter,
  scrape: scrapeRouter,
  scrapeLog: scrapeLogRouter,
});
export type AppRouter = typeof appRouter;
