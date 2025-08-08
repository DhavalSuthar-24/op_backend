import { Hono } from "hono";
import { generateAndStoreWords } from "./services.js";
import { PrismaClient } from "./generated/prisma/index.js";

const prisma = new PrismaClient();

export const route = (app: Hono) => {
  app.get("/", (c) => c.text("English Vocabulary API"));

  app.get("/words", async (c) => {
    const cursor = c.req.query("cursor");
    const limit = Math.min(parseInt(c.req.query("limit") || "50"), 50);

    const words = await prisma.word.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        synonyms: { select: { text: true } },
        antonyms: { select: { text: true } },
        sentences: { select: { text: true } },
      },
    });

    const nextCursor = words[words.length - 1]?.id || null;

    return c.json({
      data: words.map((w) => ({
        ...w,
        synonyms: w.synonyms.map((s) => s.text),
        antonyms: w.antonyms.map((a) => a.text),
        sentences: w.sentences.map((s) => s.text),
      })),
      nextCursor,
    });
  });

  app.post("/generate-words", async (c) => {
    await generateAndStoreWords();
    return c.json({ message: "Generated 10+ words." });
  });

  app.post("/trigger-cron", async (c) => {
    await generateAndStoreWords();
    return c.json({ message: "Cron job triggered with multiple words." });
  });
};
