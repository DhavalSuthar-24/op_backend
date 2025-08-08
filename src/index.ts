import { Hono } from "hono";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import cron from "node-cron";
import { swaggerUI } from "@hono/swagger-ui";
import { route } from "./routes.js";
import { generateAndStoreWords } from "./services.js";
import { swaggerDocument } from "./swagger.js";

dotenv.config();

const app = new Hono();

// Swagger docs
app.get("/docs", swaggerUI({ url: "/swagger" }));
app.get("/swagger", (c) => c.json(swaggerDocument));


// Routes
route(app);

// Daily cron job
cron.schedule("0 0 * * *", generateAndStoreWords);

// Server start
const port = parseInt(process.env.PORT || "3001");
serve({ fetch: app.fetch, port }, () =>
  console.log(`✅ Server running at http://localhost:${port}`)
);
