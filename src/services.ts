import { Groq } from "groq-sdk";
import { PrismaClient } from "./generated/prisma/index.js";
import { stripCodeFences } from "./Utils/stripper.js";

const prisma = new PrismaClient();

// Groq models configuration
const GROQ_MODELS = {
  main: "llama-3.1-8b-instant",
  creative: "llama-3.1-70b-versatile",
  fast: "gemma-7b-it",
  advanced: "openai/gpt-oss-120b",
};

function extractJsonArray(str: string) {
  const match = str.match(/\[\s*{[\s\S]*}\s*\]/);
  if (match) {
    return match[0];
  }
  throw new Error("No valid JSON array found in response");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Enhanced word generation with categories and difficulty levels
export const generateAndStoreWords = async (
  count: number = 15
): Promise<void> => {
  try {
    // Focused, higher-value categories for serious learners
    const categories = [
      "academic",
      "business",
      "technology",
      "science",
      "literature",
      "law",
      "philosophy",
    ];
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert English vocabulary teacher.
Return only valid JSON with no explanations, no code fences, and no extra text.
If you cannot provide JSON, return an empty JSON array "[]".`,
        },
        {
          role: "user",
          content: `Generate ${count} advanced-level English vocabulary words suitable for a serious learner aiming to reach C1–C2 proficiency.

The words should:
- Be moderately rare but still actively used in educated writing and speech
- Avoid overly common/basic words like "happy", "run", "good", "important", etc.
- Avoid archaic or obsolete terms unless they are still academically relevant
- Represent a variety of parts of speech
- Be intellectually engaging and practical for academic, business, or professional communication
- Be semantically diverse (not synonyms of each other)

Example target difficulty: "pernicious", "cogent", "ubiquitous", "alacrity", "tenuous", "esoteric", "fastidious", "obfuscate".

For each word, provide:
- text: the English word
- meaningHindi: Hindi translation
- meaningGujarati: Gujarati translation  
- pronunciation: IPA phonetic notation
- partOfSpeech: noun, verb, adjective, etc.
- difficulty: advanced
- category: ${randomCategory}
- etymology: brief word origin
- synonyms: array of 3-5 synonyms
- antonyms: array of 2-4 antonyms  
- sentences: array of 3 example sentences with increasing complexity
- mnemonicTrick: memory technique to remember the word
- commonMistakes: array of common usage errors
- relatedWords: array of related vocabulary

Return only a valid JSON array. Make the words challenging but practical for mastering advanced English.`,
        },
      ],
      model: GROQ_MODELS.main,
      temperature: 0.85,
      max_completion_tokens: 4000,
      top_p: 0.9,
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
        pronunciation,
        partOfSpeech,
        difficulty,
        category,
        etymology,
        synonyms,
        antonyms,
        sentences,
        mnemonicTrick,
        commonMistakes,
        relatedWords,
      } = wordData;

      if (!text) continue;

      const existing = await prisma.word.findUnique({
        where: { text: text.toLowerCase() },
      });
      if (existing) continue;

      await prisma.$transaction(async (tx) => {
        const newWord = await tx.word.create({
          data: {
            text: text.toLowerCase(),
            meaningHindi,
            meaningGujarati,
            pronunciation,
            partOfSpeech,
            difficulty,
            category,
            etymology,
            mnemonicTrick,
            commonMistakes: JSON.stringify(commonMistakes || []),
            relatedWords: JSON.stringify(relatedWords || []),
          },
        });

        await Promise.all([
          tx.synonym.createMany({
            data: (synonyms || []).map((s: string) => ({
              wordId: newWord.id,
              text: s.toLowerCase(),
            })),
          }),
          tx.antonym.createMany({
            data: (antonyms || []).map((a: string) => ({
              wordId: newWord.id,
              text: a.toLowerCase(),
            })),
          }),
          tx.sentence.createMany({
            data: (sentences || []).map((s: string, index: number) => ({
              wordId: newWord.id,
              text: s,
              difficulty:
                index === 0
                  ? "intermediate"
                  : index === 1
                  ? "advanced"
                  : "expert",
            })),
          }),
        ]);
      });
    }

    console.log(
      `✅ Generated and stored ${wordsArray.length} advanced vocabulary words`
    );
  } catch (error) {
    console.error("Word generation error:", error);
    throw error;
  }
};

// Generate interactive quiz
export const generateQuiz = async (
  type: string,
  difficulty: string,
  count: number
): Promise<any> => {
  try {
    const words = await prisma.word.findMany({
      where: { difficulty },
      include: {
        synonyms: true,
        antonyms: true,
        sentences: true,
      },
      take: count * 2, // Get more words to create variety
      orderBy: { createdAt: "desc" },
    });

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a quiz generator for English learning. Create engaging, educational quizzes.",
        },
        {
          role: "user",
          content: `Create a ${type} quiz with ${count} questions using these words: ${words
            .map((w) => w.text)
            .join(", ")}
          
          Quiz types available:
          - multiple-choice: 4 options per question
          - fill-in-the-blank: sentences with missing words
          - synonym-match: match words with synonyms
          - definition-match: match words with definitions
          - sentence-completion: complete sentences using given words
          
          For each question provide:
          - question: the question text
          - options: array of possible answers (for multiple choice)
          - correctAnswer: the correct answer
          - explanation: why this answer is correct
          - difficulty: question difficulty level
          - wordId: ID of the word being tested
          
          Make questions challenging but fair. Return as JSON object with questions array.`,
        },
      ],
      model: GROQ_MODELS.main,
      temperature: 0.7,
      max_completion_tokens: 2000,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty quiz response");

    content = stripCodeFences(content);
    const quiz = JSON.parse(content);

    // Save quiz to database
    const savedQuiz = await prisma.quiz.create({
      data: {
        type,
        difficulty,
        questions: JSON.stringify(quiz.questions),
        createdAt: new Date(),
      },
    });

    return { ...quiz, quizId: savedQuiz.id };
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw error;
  }
};

// Generate daily inspirational quote
export const generateDailyQuote = async (): Promise<void> => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Generate an inspiring, educational quote about learning, growth, or knowledge.",
        },
        {
          role: "user",
          content: `Generate one inspirational quote about learning English, personal growth, or education. 
          
          Provide:
          - quote: the inspirational text
          - author: author name (can be fictional for original quotes)
          - hindiTranslation: Hindi translation
          - gujaratiTranslation: Gujarati translation
          - explanation: brief explanation of the quote's meaning
          - relevanceToLearning: how this applies to language learning
          
          Return as JSON object.`,
        },
      ],
      model: GROQ_MODELS.creative,
      temperature: 0.9,
      max_completion_tokens: 500,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty quote response");

    content = stripCodeFences(content);
    const quoteData = JSON.parse(content);

    await prisma.dailyQuote.create({
      data: {
        quote: quoteData.quote,
        author: quoteData.author,
        hindiTranslation: quoteData.hindiTranslation,
        gujaratiTranslation: quoteData.gujaratiTranslation,
        explanation: quoteData.explanation,
        relevanceToLearning: quoteData.relevanceToLearning,
      },
    });

    console.log("✅ Generated daily quote");
  } catch (error) {
    console.error("Quote generation error:", error);
  }
};

// Generate educational fact of the day
export const generateFactOfTheDay = async (): Promise<void> => {
  try {
    const topics = [
      "science",
      "history",
      "technology",
      "nature",
      "space",
      "languages",
      "culture",
    ];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Generate an interesting, educational fact about ${randomTopic}. 
          
          Provide:
          - fact: the interesting fact
          - topic: ${randomTopic}
          - hindiTranslation: Hindi translation
          - gujaratiTranslation: Gujarati translation
          - explanation: detailed explanation
          - didYouKnow: additional related information
          - source: general source type (e.g., "Scientific Research", "Historical Records")
          
          Make it engaging and educational. Return as JSON object.`,
        },
      ],
      model: GROQ_MODELS.main,
      temperature: 0.8,
      max_completion_tokens: 600,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty fact response");

    content = stripCodeFences(content);
    const factData = JSON.parse(content);

    await prisma.factOfTheDay.create({
      data: {
        fact: factData.fact,
        topic: factData.topic,
        hindiTranslation: factData.hindiTranslation,
        gujaratiTranslation: factData.gujaratiTranslation,
        explanation: factData.explanation,
        didYouKnow: factData.didYouKnow,
        source: factData.source,
      },
    });

    console.log("✅ Generated fact of the day");
  } catch (error) {
    console.error("Fact generation error:", error);
  }
};

// Generate educational story
export const generateStory = async (
  theme: string,
  difficulty: string,
  wordsToInclude: string[]
): Promise<any> => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a creative writer specializing in educational stories for English learners.",
        },
        {
          role: "user",
          content: `Write an engaging ${difficulty}-level story with ${theme} theme. 
          
          Include these vocabulary words: ${wordsToInclude.join(", ")}
          
          Story should be:
          - 200-400 words long
          - Age-appropriate and educational  
          - Include moral lesson
          - Use vocabulary appropriate for ${difficulty} level
          
          Provide:
          - title: story title
          - story: the complete story text
          - moralLesson: key takeaway
          - vocabularyHighlights: array of key words used with definitions
          - comprehensionQuestions: 3 questions about the story
          - hindiSummary: brief Hindi summary
          - gujaratiSummary: brief Gujarati summary
          
          Return as JSON object.`,
        },
      ],
      model: GROQ_MODELS.creative,
      temperature: 0.8,
      max_completion_tokens: 1500,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty story response");

    content = stripCodeFences(content);
    const storyData = JSON.parse(content);

    // Save story to database
    const savedStory = await prisma.story.create({
      data: {
        title: storyData.title,
        content: storyData.story,
        theme,
        difficulty,
        moralLesson: storyData.moralLesson,
        vocabularyHighlights: JSON.stringify(
          storyData.vocabularyHighlights || []
        ),
        comprehensionQuestions: JSON.stringify(
          storyData.comprehensionQuestions || []
        ),
        hindiSummary: storyData.hindiSummary,
        gujaratiSummary: storyData.gujaratiSummary,
      },
    });

    return { ...storyData, storyId: savedStory.id };
  } catch (error) {
    console.error("Story generation error:", error);
    throw error;
  }
};

// Generate grammar lesson
export const generateGrammarLesson = async (
  topic: string,
  difficulty: string
): Promise<any> => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert English grammar teacher creating comprehensive lessons.",
        },
        {
          role: "user",
          content: `Create a comprehensive grammar lesson on "${topic}" for ${difficulty} level students.
          
          Include:
          - title: lesson title
          - explanation: clear explanation of the grammar rule
          - rules: array of key grammar rules
          - examples: array of example sentences showing correct usage
          - commonMistakes: array of common errors students make
          - practiceExercises: 5 practice questions with answers
          - tips: helpful tips for remembering the rule
          - hindiExplanation: brief Hindi explanation
          - gujaratiExplanation: brief Gujarati explanation
          
          Make it comprehensive but easy to understand. Return as JSON object.`,
        },
      ],
      model: GROQ_MODELS.main,
      temperature: 0.7,
      max_completion_tokens: 1200,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty grammar lesson response");

    content = stripCodeFences(content);
    const lessonData = JSON.parse(content);

    // Save lesson to database
    const savedLesson = await prisma.grammarLesson.create({
      data: {
        title: lessonData.title,
        topic,
        difficulty,
        explanation: lessonData.explanation,
        rules: JSON.stringify(lessonData.rules || []),
        examples: JSON.stringify(lessonData.examples || []),
        commonMistakes: JSON.stringify(lessonData.commonMistakes || []),
        practiceExercises: JSON.stringify(lessonData.practiceExercises || []),
        tips: JSON.stringify(lessonData.tips || []),
        hindiExplanation: lessonData.hindiExplanation,
        gujaratiExplanation: lessonData.gujaratiExplanation,
      },
    });

    return { ...lessonData, lessonId: savedLesson.id };
  } catch (error) {
    console.error("Grammar lesson generation error:", error);
    throw error;
  }
};

// Generate pronunciation guide
export const generatePronunciationGuide = async (
  word: string
): Promise<any> => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a pronunciation expert helping English learners with correct pronunciation.",
        },
        {
          role: "user",
          content: `Create a comprehensive pronunciation guide for the word "${word}".
          
          Include:
          - word: the target word
          - ipa: International Phonetic Alphabet notation
          - syllables: word broken into syllables
          - stress: which syllable to stress
          - soundTips: tips for pronouncing difficult sounds
          - similarSounds: words with similar pronunciation patterns
          - commonErrors: common mispronunciations to avoid
          - practicePhrase: a phrase to practice the word in context
          - audioDescription: description of how to make each sound
          
          Return as JSON object.`,
        },
      ],
      model: GROQ_MODELS.main,
      temperature: 0.6,
      max_completion_tokens: 800,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty pronunciation guide response");

    content = stripCodeFences(content);
    const guideData = JSON.parse(content);

    // Save pronunciation guide
    const savedGuide = await prisma.pronunciationGuide.create({
      data: {
        word: word.toLowerCase(),
        ipa: guideData.ipa,
        syllables: guideData.syllables,
        stress: guideData.stress,
        soundTips: JSON.stringify(guideData.soundTips || []),
        similarSounds: JSON.stringify(guideData.similarSounds || []),
        commonErrors: JSON.stringify(guideData.commonErrors || []),
        practicePhrase: guideData.practicePhrase,
        audioDescription: guideData.audioDescription,
      },
    });

    return { ...guideData, guideId: savedGuide.id };
  } catch (error) {
    console.error("Pronunciation guide generation error:", error);
    throw error;
  }
};

// Search words with advanced filtering
export const searchWords = async (query: string): Promise<any[]> => {
  try {
    const words = await prisma.word.findMany({
      where: {
        OR: [
          { text: { contains: query.toLowerCase(), mode: "insensitive" } },
          { meaningHindi: { contains: query, mode: "insensitive" } },
          { meaningGujarati: { contains: query, mode: "insensitive" } },
          {
            synonyms: {
              some: {
                text: { contains: query.toLowerCase(), mode: "insensitive" },
              },
            },
          },
        ],
      },
      include: {
        synonyms: { select: { text: true } },
        antonyms: { select: { text: true } },
        sentences: { select: { text: true, difficulty: true } },
      },
      take: 20,
    });

    return words.map((word) => ({
      ...word,
      synonyms: word.synonyms.map((s) => s.text),
      antonyms: word.antonyms.map((a) => a.text),
      sentences: word.sentences,
    }));
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

// Generate word association game
export const generateWordAssociation = async (
  difficulty: string
): Promise<any> => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Create a word association game for ${difficulty} level English learners.
          
          Generate:
          - centerWord: main word to associate with
          - associations: array of 8-10 related words
          - categories: different categories of associations (synonyms, related concepts, etc.)
          - explanations: why each word is associated
          - gameInstructions: how to play the association game
          - scoringSystem: how to score the game
          
          Return as JSON object.`,
        },
      ],
      model: GROQ_MODELS.main,
      temperature: 0.8,
      max_completion_tokens: 1000,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty word association response");

    content = stripCodeFences(content);
    return JSON.parse(content);
  } catch (error) {
    console.error("Word association generation error:", error);
    throw error;
  }
};

// Generate idioms and phrases
export const generateIdioms = async (count: number = 10): Promise<void> => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Generate ${count} common English idioms and phrases that are useful for learners.
          
          For each idiom provide:
          - idiom: the idiom/phrase
          - meaning: what it means
          - hindiTranslation: Hindi equivalent or explanation
          - gujaratiTranslation: Gujarati equivalent or explanation
          - examples: 2 example sentences using the idiom
          - origin: brief history of the idiom (if known)
          - difficulty: beginner/intermediate/advanced
          - category: type of idiom (business, casual, literary, etc.)
          
          Return as JSON array.`,
        },
      ],
      model: GROQ_MODELS.main,
      temperature: 0.8,
      max_completion_tokens: 2000,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty idioms response");

    content = stripCodeFences(content);
    const idiomsArray = JSON.parse(content);

    for (const idiomData of idiomsArray) {
      const existing = await prisma.idiom.findUnique({
        where: { text: idiomData.idiom.toLowerCase() },
      });

      if (!existing) {
        await prisma.idiom.create({
          data: {
            text: idiomData.idiom.toLowerCase(),
            meaning: idiomData.meaning,
            hindiTranslation: idiomData.hindiTranslation,
            gujaratiTranslation: idiomData.gujaratiTranslation,
            examples: JSON.stringify(idiomData.examples || []),
            origin: idiomData.origin,
            difficulty: idiomData.difficulty,
            category: idiomData.category,
          },
        });
      }
    }

    console.log(`✅ Generated ${idiomsArray.length} idioms`);
  } catch (error) {
    console.error("Idioms generation error:", error);
  }
};

// Clean up old data (for maintenance)
export const cleanupOldData = async (): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clean up old daily quotes (keep only last 30 days)
    await prisma.dailyQuote.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    // Clean up old facts (keep only last 30 days)
    await prisma.factOfTheDay.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    // Clean up anonymous quiz results older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await prisma.quizResult.deleteMany({
      where: {
        userId: "anonymous",
        completedAt: { lt: sevenDaysAgo },
      },
    });

    console.log("✅ Completed data cleanup");
  } catch (error) {
    console.error("Cleanup error:", error);
  }
};

// Generate conversation starters
export const generateConversationStarters = async (
  difficulty: string
): Promise<any> => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Generate conversation starters for ${difficulty} level English learners.
          
          Create:
          - topics: array of 10 conversation topics
          - questions: 3-5 questions for each topic
          - vocabulary: key vocabulary for each topic
          - culturalTips: cultural context for conversations
          - practiceScenarios: role-play scenarios
          
          Make them practical and engaging. Return as JSON object.`,
        },
      ],
      model: GROQ_MODELS.main,
      temperature: 0.8,
      max_completion_tokens: 1500,
    });

    let content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty conversation starters response");

    content = stripCodeFences(content);
    return JSON.parse(content);
  } catch (error) {
    console.error("Conversation starters generation error:", error);
    throw error;
  }
};
