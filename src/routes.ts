import { Hono } from "hono";
import {
  generateAndStoreWords,
  generateQuiz,
  generateDailyQuote,
  generateFactOfTheDay,
  generateStory,
  generateGrammarLesson,
  searchWords,
  generatePronunciationGuide,
} from "./services.js";
import { PrismaClient } from "./generated/prisma/index.js";
import { validator } from "hono/validator";
import { generateToken, hashPassword, verifyPassword, authMiddleware, User } from "./middleware/auth.js";

// Extend Hono types
declare module 'hono' {
  interface ContextVariableMap {
    user: User;
  }
}

const prisma = new PrismaClient();

export const route = (app: Hono) => {
  // Home route
  app.get("/", (c) =>
    c.json({
      message: "Enhanced English Learning API",
      version: "2.0.0",
      endpoints: [
        "/words",
        "/quiz",
        "/daily-content",
        "/stories",
        "/grammar",
        "/pronunciation",
        "/auth/register",
        "/auth/login",
      ],
    })
  );

  // ==== AUTH ROUTES (No Authentication Required) ====

  // Register user
  app.post(
    "/auth/register",
    validator("json", (value, c) => {
      const { name, email, password } = value;
      if (!name || !email || !password) {
        return c.json({ error: "Name, email, and password are required" }, 400);
      }
      if (password.length < 6) {
        return c.json({ error: "Password must be at least 6 characters long" }, 400);
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return c.json({ error: "Invalid email format" }, 400);
      }
      return { name: name.trim(), email: email.toLowerCase().trim(), password };
    }),
    async (c) => {
      const { name, email, password } = await c.req.json();
      try {
        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
          data: { 
            name, 
            email, 
            passwordHash, 
            username: email.split("@")[0] + Math.random().toString(36).substring(2, 5)
          }
        });

        const token = await generateToken(user);
        return c.json({
          success: true,
          token,
          user: { id: user.id, name: user.name, email: user.email, username: user.username }
        });
      } catch (error: any) {
        if (error.code === "P2002") {
          return c.json({ error: "Email already exists" }, 409);
        }
        console.error("Registration error:", error);
        return c.json({ error: "Failed to create account" }, 500);
      }
    }
  );

  // Login user
  app.post(
    "/auth/login",
    validator("json", (value, c) => {
      const { email, password } = value;
      if (!email || !password) {
        return c.json({ error: "Email and password are required" }, 400);
      }
      return { email: email.toLowerCase().trim(), password };
    }),
    async (c) => {
      const { email, password } = await c.req.json();
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return c.json({ error: "Invalid credentials" }, 401);

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return c.json({ error: "Invalid credentials" }, 401);

        const token = await generateToken(user);
        return c.json({
          success: true,
          token,
          user: { id: user.id, name: user.name, email: user.email, username: user.username }
        });
      } catch (error) {
        console.error("Login error:", error);
        return c.json({ error: "Login failed" }, 500);
      }
    }
  );

  // ==== PUBLIC ROUTES (No Authentication Required) ====

  // Get paginated words (Public)
  app.get("/words", async (c) => {
    try {
      const cursor = c.req.query("cursor");
      const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
      const difficulty = c.req.query("difficulty");
      const category = c.req.query("category");

      const where = {
        ...(difficulty && { difficulty }),
        ...(category && { category }),
      };

      const words = await prisma.word.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          synonyms: { select: { text: true } },
          antonyms: { select: { text: true } },
          sentences: { select: { text: true, difficulty: true } },
        },
      });

      const nextCursor = words[words.length - 1]?.id || null;

      return c.json({
        data: words.map((w) => ({
          ...w,
          synonyms: w.synonyms.map((s) => s.text),
          antonyms: w.antonyms.map((a) => a.text),
          sentences: w.sentences.map((s) => ({
            text: s.text,
            difficulty: s.difficulty,
          })),
        })),
        nextCursor,
        hasMore: words.length === limit,
      });
    } catch (error) {
      console.error("Get words error:", error);
      return c.json({ error: "Failed to fetch words" }, 500);
    }
  });

  // Search words (Public)
  app.get("/words/search", async (c) => {
    try {
      const query = c.req.query("q");
      if (!query)
        return c.json({ error: "Query parameter 'q' is required" }, 400);

      const results = await searchWords(query);
      return c.json({ data: results });
    } catch (error) {
      console.error("Search words error:", error);
      return c.json({ error: "Search failed" }, 500);
    }
  });

  // Get word by ID (Public)
  app.get("/words/:id", async (c) => {
    try {
      const id = c.req.param("id");

      const word = await prisma.word.findUnique({
        where: { id },
        include: {
          synonyms: true,
          antonyms: true,
          sentences: true,
        },
      });

      if (!word) return c.json({ error: "Word not found" }, 404);
      return c.json({ data: word });
    } catch (error) {
      console.error("Get word error:", error);
      return c.json({ error: "Failed to fetch word" }, 500);
    }
  });

  // Generate quiz (Public)
  app.post(
    "/quiz/generate",
    validator("json", (value, c) => {
      const { type, difficulty, count } = value;
      if (!type) return c.json({ error: "Quiz type is required" }, 400);
      return {
        type,
        difficulty: difficulty || "intermediate",
        count: Math.min(count || 10, 50), // Limit to 50 questions
      };
    }),
    async (c) => {
      try {
        const { type, difficulty, count } = await c.req.json();
        const quiz = await generateQuiz(type, difficulty, count);
        return c.json({ data: quiz });
      } catch (error) {
        console.error("Generate quiz error:", error);
        return c.json({ error: "Failed to generate quiz" }, 500);
      }
    }
  );

  // Get daily quote (Public)
  app.get("/daily/quote", async (c) => {
    try {
      const quote = await prisma.dailyQuote.findFirst({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!quote) {
        await generateDailyQuote();
        const newQuote = await prisma.dailyQuote.findFirst({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          orderBy: { createdAt: "desc" },
        });
        return c.json({ data: newQuote });
      }

      return c.json({ data: quote });
    } catch (error) {
      console.error("Get daily quote error:", error);
      return c.json({ error: "Failed to fetch daily quote" }, 500);
    }
  });

  // Get fact of the day (Public)
  app.get("/daily/fact", async (c) => {
    try {
      const fact = await prisma.factOfTheDay.findFirst({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!fact) {
        await generateFactOfTheDay();
        const newFact = await prisma.factOfTheDay.findFirst({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          orderBy: { createdAt: "desc" },
        });
        return c.json({ data: newFact });
      }

      return c.json({ data: fact });
    } catch (error) {
      console.error("Get daily fact error:", error);
      return c.json({ error: "Failed to fetch daily fact" }, 500);
    }
  });

  // Get word of the day (Public)
  app.get("/daily/word", async (c) => {
    try {
      const word = await prisma.word.findFirst({
        where: {
          isWordOfTheDay: true,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        include: {
          synonyms: true,
          antonyms: true,
          sentences: true,
        },
      });

      return c.json({ data: word });
    } catch (error) {
      console.error("Get word of the day error:", error);
      return c.json({ error: "Failed to fetch word of the day" }, 500);
    }
  });

  // Generate story (Public)
  app.post(
    "/stories/generate",
    validator("json", (value, c) => {
      const { theme, difficulty, wordsToInclude } = value;
      return {
        theme: theme || "adventure",
        difficulty: difficulty || "intermediate",
        wordsToInclude: Array.isArray(wordsToInclude) ? wordsToInclude : [],
      };
    }),
    async (c) => {
      try {
        const { theme, difficulty, wordsToInclude } = await c.req.json();
        const story = await generateStory(theme, difficulty, wordsToInclude);
        return c.json({ data: story });
      } catch (error) {
        console.error("Generate story error:", error);
        return c.json({ error: "Failed to generate story" }, 500);
      }
    }
  );

  // Get saved stories (Public)
  app.get("/stories", async (c) => {
    try {
      const stories = await prisma.story.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      return c.json({ data: stories });
    } catch (error) {
      console.error("Get stories error:", error);
      return c.json({ error: "Failed to fetch stories" }, 500);
    }
  });

  // Generate grammar lesson (Public)
  app.post(
    "/grammar/lesson",
    validator("json", (value, c) => {
      const { topic, difficulty } = value;
      if (!topic) return c.json({ error: "Grammar topic is required" }, 400);
      return { topic, difficulty: difficulty || "intermediate" };
    }),
    async (c) => {
      try {
        const { topic, difficulty } = await c.req.json();
        const lesson = await generateGrammarLesson(topic, difficulty);
        return c.json({ data: lesson });
      } catch (error) {
        console.error("Generate grammar lesson error:", error);
        return c.json({ error: "Failed to generate grammar lesson" }, 500);
      }
    }
  );

  // Get grammar topics (Public)
  app.get("/grammar/topics", async (c) => {
    const topics = [
      "Present Perfect Tense",
      "Past Continuous",
      "Future Perfect",
      "Conditional Sentences",
      "Passive Voice",
      "Reported Speech",
      "Modal Verbs",
      "Relative Clauses",
      "Subjunctive Mood",
      "Phrasal Verbs",
      "Articles",
      "Prepositions",
    ];
    return c.json({ data: topics });
  });

  // Generate pronunciation guide (Public)
  app.post(
    "/pronunciation/guide",
    validator("json", (value, c) => {
      const { word } = value;
      if (!word) return c.json({ error: "Word is required" }, 400);
      return { word: word.trim() };
    }),
    async (c) => {
      try {
        const { word } = await c.req.json();
        const guide = await generatePronunciationGuide(word);
        return c.json({ data: guide });
      } catch (error) {
        console.error("Generate pronunciation guide error:", error);
        return c.json({ error: "Failed to generate pronunciation guide" }, 500);
      }
    }
  );

  // Widget word endpoint (Public)
  app.get("/widget/word/next", async (c) => {
    try {
      const userId = c.req.query("userId");

      const word = await prisma.word.findFirst({
        where: userId
          ? { userProgress: { none: { userId } } }
          : {},
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          text: true,
          meaningHindi: true,
          meaningGujarati: true,
          pronunciation: true,
          partOfSpeech: true,
          difficulty: true,
          category: true,
          etymology: true,
          mnemonicTrick: true,
          commonMistakes: true,
          relatedWords: true,
          synonyms: { select: { text: true } },
          antonyms: { select: { text: true } },
          sentences: { select: { text: true } },
        },
      });

      if (!word) return c.json({ error: "No word available" }, 404);

      // Track widget view if user is provided
      if (userId) {
        await prisma.userProgress.upsert({
          where: { userId_wordId: { userId, wordId: word.id } },
          update: { lastReviewed: new Date() },
          create: { userId, wordId: word.id },
        });
      }

      return c.json({ data: word });
    } catch (error) {
      console.error("Get widget word error:", error);
      return c.json({ error: "Failed to fetch word" }, 500);
    }
  });

  // ==== PROTECTED ROUTES (Authentication Required) ====

  // Mark word as learned (Protected)
  app.post(
    "/words/:id/learned",
    authMiddleware,
    validator("json", (value, c) => {
      return value;
    }),
    async (c) => {
      try {
        const wordId = c.req.param("id");
        const user = c.get("user") as User;

        await prisma.userProgress.upsert({
          where: { userId_wordId: { userId: user.id, wordId } },
          update: {
            isLearned: true,
            reviewCount: { increment: 1 },
            lastReviewed: new Date(),
          },
          create: { userId: user.id, wordId, isLearned: true, reviewCount: 1 },
        });

        return c.json({ message: "Word marked as learned", success: true });
      } catch (error) {
        console.error("Mark word as learned error:", error);
        return c.json({ error: "Failed to mark word as learned" }, 500);
      }
    }
  );

  // Submit quiz answers (Protected)
  app.post(
    "/quiz/submit",
    authMiddleware,
    validator("json", (value, c) => {
      if (!value.answers || !Array.isArray(value.answers)) {
        return c.json({ error: "Answers array is required" }, 400);
      }
      return value;
    }),
    async (c) => {
      try {
        const { answers, quizId } = await c.req.json();
        const user = c.get("user") as User;

        const score = calculateQuizScore(answers);
        const result = await prisma.quizResult.create({
          data: {
            userId: user.id,
            quizId: quizId || `quiz_${Date.now()}`,
            answers: JSON.stringify(answers),
            score,
            completedAt: new Date(),
          },
        });

        return c.json({ data: result, success: true });
      } catch (error) {
        console.error("Submit quiz error:", error);
        return c.json({ error: "Failed to submit quiz" }, 500);
      }
    }
  );

  // Get user progress (Protected)
  app.get("/progress", authMiddleware, async (c) => {
    try {
      const user = c.get("user") as User;

      const progress = await prisma.userProgress.findMany({
        where: { userId: user.id },
        include: { word: true },
        orderBy: { lastReviewed: "desc" },
      });

      const stats = {
        totalWords: progress.length,
        learnedWords: progress.filter((p) => p.isLearned).length,
        streakDays: await calculateStreak(user.id),
        averageReviewCount:
          progress.reduce((sum, p) => sum + p.reviewCount, 0) / progress.length || 0,
      };

      return c.json({ data: { progress, stats }, success: true });
    } catch (error) {
      console.error("Get user progress error:", error);
      return c.json({ error: "Failed to fetch progress" }, 500);
    }
  });

  // Get user profile (Protected)
  app.get("/auth/profile", authMiddleware, async (c) => {
    try {
      const user = c.get("user") as User;

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          streak: true,
          badges: {
            orderBy: { earnedAt: "desc" },
            take: 5,
          },
          _count: {
            select: {
              progress: { where: { isLearned: true } },
              badges: true,
              quizResults: true,
            },
          },
        },
      });

      if (!fullUser) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({
        success: true,
        user: {
          id: fullUser.id,
          name: fullUser.name,
          email: fullUser.email,
          username: fullUser.username,
          createdAt: fullUser.createdAt,
          stats: {
            wordsLearned: fullUser._count.progress,
            totalBadges: fullUser._count.badges,
            quizzesCompleted: fullUser._count.quizResults,
            currentStreak: fullUser.streak?.currentDays || 0,
            longestStreak: fullUser.streak?.longestDays || 0,
            memberSince: fullUser.createdAt,
          },
          recentBadges: fullUser.badges,
        },
      });
    } catch (error) {
      console.error("Get user profile error:", error);
      return c.json({ error: "Failed to fetch profile" }, 500);
    }
  });

  // Update user profile (Protected)
  app.put(
    "/auth/profile",
    authMiddleware,
    validator("json", (value, c) => {
      const { name } = value;
      if (!name || name.trim().length === 0) {
        return c.json({ error: "Name is required" }, 400);
      }
      return { name: name.trim() };
    }),
    async (c) => {
      try {
        const user = c.get("user") as User;
        const { name } = await c.req.json();

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { name },
        });

        return c.json({
          success: true,
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            username: updatedUser.username,
            updatedAt: updatedUser.updatedAt,
          },
          message: "Profile updated successfully!",
        });
      } catch (error: any) {
        if (error.code === "P2025") {
          return c.json({ error: "User not found" }, 404);
        }
        console.error("Update profile error:", error);
        return c.json({ error: "Failed to update profile" }, 500);
      }
    }
  );

  // ==== ADMIN ROUTES (Protected) ====

  // Manual word generation (Admin only - you might want to add admin check)
  app.post("/admin/generate-words", async (c) => {
    try {
      await generateAndStoreWords();
      return c.json({ message: "Generated new vocabulary words.", success: true });
    } catch (error) {
      console.error("Generate words error:", error);
      return c.json({ error: "Failed to generate words" }, 500);
    }
  });

  // Trigger daily content generation (Admin only)
  app.post("/admin/generate-daily-content", async (c) => {
    try {
      await Promise.all([generateDailyQuote(), generateFactOfTheDay()]);
      return c.json({ message: "Generated daily content.", success: true });
    } catch (error) {
      console.error("Generate daily content error:", error);
      return c.json({ error: "Failed to generate daily content" }, 500);
    }
  });

  // Get API statistics (Admin only)
  app.get("/admin/stats", authMiddleware, async (c) => {
    try {
      const [wordCount, quizCount, userCount] = await Promise.all([
        prisma.word.count(),
        prisma.quizResult.count(),
        prisma.userProgress
          .groupBy({
            by: ["userId"],
            _count: { userId: true },
          })
          .then((result) => result.length),
      ]);

      return c.json({
        success: true,
        data: {
          totalWords: wordCount,
          totalQuizzes: quizCount,
          totalUsers: userCount,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Get admin stats error:", error);
      return c.json({ error: "Failed to fetch statistics" }, 500);
    }
  });
};

// Helper functions
const calculateQuizScore = (answers: any[]): number => {
  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  return Math.round((correctAnswers / answers.length) * 100);
};

const calculateStreak = async (userId: string): Promise<number> => {
  try {
    const progress = await prisma.userProgress.findMany({
      where: { userId },
      orderBy: { lastReviewed: "desc" },
      select: { lastReviewed: true },
    });

    if (progress.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // End of today

    for (const p of progress) {
      const reviewDate = new Date(p.lastReviewed);
      reviewDate.setHours(23, 59, 59, 999); // End of review day
      
      const daysDiff = Math.floor(
        (currentDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 1) {
        streak++;
        currentDate = reviewDate;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error("Calculate streak error:", error);
    return 0;
  }
};