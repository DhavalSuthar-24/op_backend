import { Groq } from "groq-sdk";
import { PrismaClient } from "./generated/prisma/index.js";
import { stripCodeFences } from "./Utils/stripper.js";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const generateAndStoreWords = async (): Promise<void> => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Generate 10 new English words... (same prompt)`,
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 1,
      max_completion_tokens: 2048,
      top_p: 1,
      stream: false,
      stop: null,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq");

    content = stripCodeFences(content);
    const wordsArray = JSON.parse(content);

    for (const wordData of wordsArray) {
      const {
        text,
        meaningHindi,
        meaningGujarati,
        synonyms,
        antonyms,
        sentences,
      } = wordData;
      if (!text) continue;

      const existing = await prisma.word.findUnique({ where: { text } });
      if (existing) continue;

      await prisma.$transaction(async (tx) => {
        const newWord = await tx.word.create({
          data: { text, meaningHindi, meaningGujarati },
        });

        await Promise.all([
          tx.synonym.createMany({
            data: synonyms.map((s: string) => ({
              wordId: newWord.id,
              text: s,
            })),
          }),
          tx.antonym.createMany({
            data: antonyms.map((a: string) => ({
              wordId: newWord.id,
              text: a,
            })),
          }),
          tx.sentence.createMany({
            data: sentences.map((s: string) => ({
              wordId: newWord.id,
              text: s,
            })),
          }),
        ]);
      });
    }
  } catch (error) {
    console.error("Word generation error:", error);
  }
};
