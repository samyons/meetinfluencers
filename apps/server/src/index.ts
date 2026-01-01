import { createContext } from "@app/api/context";
import { appRouter } from "@app/api/routers/index";
import { auth } from "@app/auth";
import { env } from "@app/env/server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { streamSSE } from "hono/streaming";
import { scrapeEvents, type ScrapeEvent } from "@app/api/services/scrape-events";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/api/scrape/stream/:sessionId", (c) => {
  const sessionId = c.req.param("sessionId");

  return streamSSE(c, async (stream) => {
    const listener = async (event: ScrapeEvent) => {
      await stream.writeSSE({
        data: JSON.stringify(event),
        event: event.type,
      });
    };

    scrapeEvents.subscribe(sessionId, listener);

    const pingInterval = setInterval(async () => {
      await stream.writeSSE({ data: "ping", event: "ping" });
    }, 30000);

    stream.onAbort(() => {
      clearInterval(pingInterval);
      scrapeEvents.unsubscribe(sessionId, listener);
    });

    await stream.sleep(1000 * 60 * 60);
  });
});

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    endpoint: "/api/trpc",
    createContext: (_opts, c) => {
      return createContext({ context: c });
    },
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
