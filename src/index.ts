import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import dotenv from "dotenv";
import cron from "node-cron";
import { swaggerUI } from "@hono/swagger-ui";
import { route } from "./routes.js";
import { 
  generateAndStoreWords, 
  generateDailyQuote, 
  generateFactOfTheDay,
  cleanupOldData 
} from "./services.js";
import { swaggerDocument } from "./swagger.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = new Hono();

// Middleware
app.use("*", cors({
  origin: ["http://localhost:3000", "https://yourdomain.com"],
  allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests", "Content-Type"],
  allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
  exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
  maxAge: 600,
  credentials: true,
}));

app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", rateLimiter);

// Health check
app.get("/health", (c) => c.json({ 
  status: "healthy", 
  timestamp: new Date().toISOString(),
  version: "2.0.0"
}));

// Swagger docs
app.get("/docs", swaggerUI({ url: "/swagger" }));
app.get("/swagger", (c) => c.json(swaggerDocument));

// Routes
route(app);

// Cron jobs
// Daily word generation at midnight
cron.schedule("0 0 * * *", () => {
  console.log("🔄 Running daily word generation...");
  generateAndStoreWords();
});

// Daily quote generation at 6 AM
cron.schedule("0 6 * * *", () => {
  console.log("🔄 Generating daily quote...");
  generateDailyQuote();
});

// Daily fact generation at 8 AM
cron.schedule("0 8 * * *", () => {
  console.log("🔄 Generating fact of the day...");
  generateFactOfTheDay();
});

// Weekly cleanup at Sunday 2 AM
cron.schedule("0 2 * * 0", () => {
  console.log("🧹 Running weekly cleanup...");
  cleanupOldData();
});

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: "Internal Server Error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Route not found" }, 404);
});

// Server start
const port = parseInt(process.env.PORT || "3001");
serve({ fetch: app.fetch, port }, () =>
  console.log(`✅ Enhanced Learning API running at http://localhost:${port}`)
);