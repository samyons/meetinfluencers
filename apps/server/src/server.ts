import app from "./index";

const server = Bun.serve({
  fetch: app.fetch,
  port: 3000,
  idleTimeout: 120,
});

console.log(`🚀 Server running on http://localhost:${server.port}`);
