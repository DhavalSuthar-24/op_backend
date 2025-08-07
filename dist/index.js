import { Hono } from "hono";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import cron from "node-cron";
import { Groq } from "groq-sdk";
import { PrismaClient } from "./generated/prisma/index.js";
dotenv.config();
const app = new Hono();
const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// Helper to strip markdown code fences
const stripCodeFences = (input) => {
    return input
        .trim()
        .replace(/^```(?:json)?[\r\n]?/, '')
        .replace(/\s*```$/g, '')
        .trim();
};
// Generate and store multiple words (10+)
const generateAndStoreWords = async () => {
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: `Generate 10 new English words that are medium to hard to master.

Output the result in **Prisma-ready JSON** format as an array, matching the following structure for each object:

- text: the word (must be unique).
- meaningHindi: the meaning in Hindi.
- meaningGujarati: the meaning in Gujarati.
- synonyms: a list of 3–5 similar words.
- antonyms: a list of 2–3 opposite words.
- sentences: 2–3 example sentences using the word in a natural context.

Make sure:
- All text is proper English with correct punctuation.
- Meanings are culturally and linguistically accurate.
- Sentences are clear, natural, and demonstrate usage well.
- Do not include ID, timestamps, or Prisma keywords.

Only return the JSON array. No extra commentary or explanation.
`
                }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 1,
            max_completion_tokens: 2048,
            top_p: 1,
            stream: false,
            stop: null,
        });
        let content = response.choices[0]?.message?.content;
        console.log("Raw content from Groq:", content);
        if (!content)
            throw new Error("Empty response from Groq");
        content = stripCodeFences(content);
        let wordsArray;
        try {
            wordsArray = JSON.parse(content);
        }
        catch (jsonErr) {
            console.error("Failed to parse JSON after stripping code fences:", content);
            throw jsonErr;
        }
        for (const wordData of wordsArray) {
            const { text, meaningHindi, meaningGujarati, synonyms, antonyms, sentences } = wordData;
            if (!text)
                continue;
            const existing = await prisma.word.findUnique({ where: { text } });
            if (existing) {
                console.log(`Skipping existing word: ${text}`);
                continue;
            }
            await prisma.$transaction(async (tx) => {
                const newWord = await tx.word.create({
                    data: { text, meaningHindi, meaningGujarati }
                });
                await Promise.all([
                    tx.synonym.createMany({ data: synonyms.map(s => ({ wordId: newWord.id, text: s })) }),
                    tx.antonym.createMany({ data: antonyms.map(a => ({ wordId: newWord.id, text: a })) }),
                    tx.sentence.createMany({ data: sentences.map(s => ({ wordId: newWord.id, text: s })) }),
                ]);
            });
            console.log(`Added new word: ${text}`);
        }
    }
    catch (error) {
        console.error("Word generation error:", error);
    }
};
// Schedule daily at 00:00 UTC
cron.schedule("0 0 * * *", generateAndStoreWords);
// API Endpoints
app.get("/", (c) => c.text("English Vocabulary API"));
app.get("/words", async (c) => {
    const cursor = c.req.query("cursor");
    const limit = Math.min(parseInt(c.req.query("limit") || "50"), 50);
    const words = await prisma.word.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: { synonyms: { select: { text: true } }, antonyms: { select: { text: true } }, sentences: { select: { text: true } } },
    });
    const nextCursor = words[words.length - 1]?.id || null;
    return c.json({ data: words.map(w => ({ ...w, synonyms: w.synonyms.map(s => s.text), antonyms: w.antonyms.map(a => a.text), sentences: w.sentences.map(s => s.text) })), nextCursor });
});
app.post("/generate-words", async (c) => {
    await generateAndStoreWords();
    return c.json({ message: "Generated 10+ words." });
});
app.post("/trigger-cron", async (c) => {
    await generateAndStoreWords();
    return c.json({ message: "Cron job triggered with multiple words." });
});
// Start server
const port = parseInt(process.env.PORT || "3001");
serve({ fetch: app.fetch, port }, () => console.log(`✅ Server running at http://localhost:${port}`));
