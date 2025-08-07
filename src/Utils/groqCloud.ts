import { Groq } from 'groq-sdk';

const groq = new Groq();

const chatCompletion = await groq.chat.completions.create({
  messages: [
    {
      role: 'user',
      content: `Give me a new English word that is medium to hard to master.

Output the result in **Prisma-ready JSON** format, matching the following structure:

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

Only return the object in raw JSON format. No extra commentary or explanation.`
    }
  ],
  model: 'meta-llama/llama-4-scout-17b-16e-instruct',
  temperature: 1,
  max_completion_tokens: 1024,
  top_p: 1,
  stream: true,
  stop: null
});

for await (const chunk of chatCompletion) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
