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

const prisma = new PrismaClient();

export const route = (app: Hono) => {
  // Home route
  app.get("/", (c) => c.json({ 
    message: "Enhanced English Learning API", 
    version: "2.0.0",
    endpoints: ["/words", "/quiz", "/daily-content", "/stories", "/grammar", "/pronunciation"]
  }));

  // ==== VOCABULARY ROUTES ====
  
  // Get paginated words
  app.get("/words", async (c) => {
    const cursor = c.req.query("cursor");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);
    const difficulty = c.req.query("difficulty"); // beginner, intermediate, advanced
    const category = c.req.query("category"); // academic, business, casual, etc.

    const where = {
      ...(difficulty && { difficulty }),
      ...(category && { category })
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
        sentences: w.sentences.map((s) => ({ text: s.text, difficulty: s.difficulty })),
      })),
      nextCursor,
      hasMore: words.length === limit
    });
  });

  // Search words
  app.get("/words/search", async (c) => {
    const query = c.req.query("q");
    if (!query) return c.json({ error: "Query parameter 'q' is required" }, 400);
    
    const results = await searchWords(query);
    return c.json({ data: results });
  });

  // Get word by ID with detailed info
  app.get("/words/:id", async (c) => {
    const id = c.req.param("id");
    
    const word = await prisma.word.findUnique({
      where: { id },
      include: {
        synonyms: true,
        antonyms: true,
        sentences: true,
        userProgress: true
      }
    });

    if (!word) return c.json({ error: "Word not found" }, 404);
    return c.json({ data: word });
  });

  // Mark word as learned
  app.post("/words/:id/learned", 
    validator("json", (value, c) => {
      if (!value.userId) return c.json({ error: "userId is required" }, 400);
      return value;
    }),
    async (c) => {
      const wordId = c.req.param("id");
      const { userId } = await c.req.json();

      await prisma.userProgress.upsert({
        where: { userId_wordId: { userId, wordId } },
        update: { 
          isLearned: true, 
          reviewCount: { increment: 1 },
          lastReviewed: new Date()
        },
        create: { userId, wordId, isLearned: true, reviewCount: 1 }
      });

      return c.json({ message: "Word marked as learned" });
    }
  );

  // ==== QUIZ ROUTES ====

  // Generate quiz
  app.post("/quiz/generate", 
    validator("json", (value, c) => {
      const { type, difficulty, count } = value;
      if (!type) return c.json({ error: "Quiz type is required" }, 400);
      return { type, difficulty: difficulty || "intermediate", count: count || 10 };
    }),
    async (c) => {
      const { type, difficulty, count } = await c.req.json();
      const quiz = await generateQuiz(type, difficulty, count);
      return c.json({ data: quiz });
    }
  );

  // Submit quiz answers
  app.post("/quiz/submit",
    validator("json", (value, c) => {
      if (!value.answers || !Array.isArray(value.answers)) {
        return c.json({ error: "Answers array is required" }, 400);
      }
      return value;
    }),
    async (c) => {
      const { answers, userId, quizId } = await c.req.json();
      
      // Calculate score and save results
      const result = await prisma.quizResult.create({
        data: {
          userId: userId || "anonymous",
          quizId,
          answers: JSON.stringify(answers),
          score: calculateQuizScore(answers),
          completedAt: new Date()
        }
      });

      return c.json({ data: result });
    }
  );

  // ==== DAILY CONTENT ROUTES ====

  // Get daily quote
  app.get("/daily/quote", async (c) => {
    const quote = await prisma.dailyQuote.findFirst({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!quote) {
      // Generate new quote if none exists for today
      await generateDailyQuote();
      return c.redirect("/daily/quote");
    }

    return c.json({ data: quote });
  });

  // Get fact of the day
  app.get("/daily/fact", async (c) => {
    const fact = await prisma.factOfTheDay.findFirst({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!fact) {
      await generateFactOfTheDay();
      return c.redirect("/daily/fact");
    }

    return c.json({ data: fact });
  });

  // Get word of the day
  app.get("/daily/word", async (c) => {
    const word = await prisma.word.findFirst({
      where: {
        isWordOfTheDay: true,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      include: {
        synonyms: true,
        antonyms: true,
        sentences: true
      }
    });

    return c.json({ data: word });
  });

  // ==== STORY ROUTES ====

  // Generate story
  app.post("/stories/generate",
    validator("json", (value, c) => {
      const { theme, difficulty, wordsToInclude } = value;
      return { 
        theme: theme || "adventure", 
        difficulty: difficulty || "intermediate",
        wordsToInclude: wordsToInclude || []
      };
    }),
    async (c) => {
      const { theme, difficulty, wordsToInclude } = await c.req.json();
      const story = await generateStory(theme, difficulty, wordsToInclude);
      return c.json({ data: story });
    }
  );

  // Get saved stories
  app.get("/stories", async (c) => {
    const stories = await prisma.story.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return c.json({ data: stories });
  });

  // ==== GRAMMAR ROUTES ====

  // Generate grammar lesson
  app.post("/grammar/lesson",
    validator("json", (value, c) => {
      const { topic, difficulty } = value;
      if (!topic) return c.json({ error: "Grammar topic is required" }, 400);
      return { topic, difficulty: difficulty || "intermediate" };
    }),
    async (c) => {
      const { topic, difficulty } = await c.req.json();
      const lesson = await generateGrammarLesson(topic, difficulty);
      return c.json({ data: lesson });
    }
  );

  // Get grammar topics
  app.get("/grammar/topics", async (c) => {
    const topics = [
      "Present Perfect Tense", "Past Continuous", "Future Perfect",
      "Conditional Sentences", "Passive Voice", "Reported Speech",
      "Modal Verbs", "Relative Clauses", "Subjunctive Mood",
      "Phrasal Verbs", "Articles", "Prepositions"
    ];
    return c.json({ data: topics });
  });

  // ==== PRONUNCIATION ROUTES ====

  // Generate pronunciation guide
  app.post("/pronunciation/guide",
    validator("json", (value, c) => {
      const { word } = value;
      if (!word) return c.json({ error: "Word is required" }, 400);
      return { word };
    }),
    async (c) => {
      const { word } = await c.req.json();
      const guide = await generatePronunciationGuide(word);
      return c.json({ data: guide });
    }
  );

  // ==== USER PROGRESS ROUTES ====

  // Get user progress
  app.get("/progress/:userId", async (c) => {
    const userId = c.req.param("userId");
    
    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: { word: true },
      orderBy: { lastReviewed: "desc" }
    });

    const stats = {
      totalWords: progress.length,
      learnedWords: progress.filter(p => p.isLearned).length,
      streakDays: await calculateStreak(userId),
      averageReviewCount: progress.reduce((sum, p) => sum + p.reviewCount, 0) / progress.length || 0
    };

    return c.json({ data: { progress, stats } });
  });

  // ==== ADMIN ROUTES ====

  // Manual word generation
  app.post("/admin/generate-words", async (c) => {
    await generateAndStoreWords();
    return c.json({ message: "Generated new vocabulary words." });
  });

  // Trigger daily content generation
  app.post("/admin/generate-daily-content", async (c) => {
    await Promise.all([
      generateDailyQuote(),
      generateFactOfTheDay()
    ]);
    return c.json({ message: "Generated daily content." });
  });

  // Get API statistics
  app.get("/admin/stats", async (c) => {
    const [wordCount, quizCount, userCount] = await Promise.all([
      prisma.word.count(),
      prisma.quizResult.count(),
      prisma.userProgress.groupBy({
        by: ['userId'],
        _count: { userId: true }
      }).then(result => result.length)
    ]);

    return c.json({
      data: {
        totalWords: wordCount,
        totalQuizzes: quizCount,
        totalUsers: userCount,
        lastUpdated: new Date().toISOString()
      }
    });
  });


  app.post("/auth/register", 
    validator("json", (value, c) => {
      const { name, username } = value;
      if (!name || !username) {
        return c.json({ error: "Name and username are required" }, 400);
      }
      if (username.length < 3) {
        return c.json({ error: "Username must be at least 3 characters" }, 400);
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return c.json({ error: "Username can only contain letters, numbers, and underscores" }, 400);
      }
      return { name: name.trim(), username: username.toLowerCase().trim() };
    }),
    async (c) => {
      const { name, username } = await c.req.json();
      
      try {
        const user = await prisma.user.create({
          data: { name, username }
        });
        
        // Create initial learning streak
        await prisma.learningStreak.create({
          data: { userId: user.id }
        });
        
        return c.json({ 
          success: true,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            createdAt: user.createdAt
          },
          message: "Account created successfully! Welcome to English Learning!" 
        });
        
      } catch (error: any) {
        if (error.code === 'P2002') { // Unique constraint violation
          return c.json({ error: "Username already exists" }, 409);
        }
        return c.json({ error: "Failed to create account" }, 500);
      }
    }
  );

  // Login user
  app.post("/auth/login",
    validator("json", (value, c) => {
      const { username } = value;
      if (!username) {
        return c.json({ error: "Username is required" }, 400);
      }
      return { username: username.toLowerCase().trim() };
    }),
    async (c) => {
      const { username } = await c.req.json();
      
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          streak: true,
          _count: {
            select: {
              progress: { where: { isLearned: true } },
              badges: true
            }
          }
        }
      });
      
      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }
      
      return c.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          createdAt: user.createdAt,
          stats: {
            wordsLearned: user._count.progress,
            badges: user._count.badges,
            currentStreak: user.streak?.currentDays || 0,
            longestStreak: user.streak?.longestDays || 0
          }
        },
        message: `Welcome back, ${user.name}!`
      });
    }
  );

  // Get user profile
  app.get("/auth/profile/:userId", async (c) => {
    const userId = c.req.param("userId");
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        streak: true,
        badges: {
          orderBy: { earnedAt: "desc" },
          take: 5
        },
        _count: {
          select: {
            progress: { where: { isLearned: true } },
            badges: true,
            quizResults: true
          }
        }
      }
    });
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    return c.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        createdAt: user.createdAt,
        stats: {
          wordsLearned: user._count.progress,
          totalBadges: user._count.badges,
          quizzesCompleted: user._count.quizResults,
          currentStreak: user.streak?.currentDays || 0,
          longestStreak: user.streak?.longestDays || 0,
          memberSince: user.createdAt
        },
        recentBadges: user.badges
      }
    });
  });

  // Update user profile
  app.put("/auth/profile/:userId",
    validator("json", (value, c) => {
      const { name } = value;
      if (!name || name.trim().length === 0) {
        return c.json({ error: "Name is required" }, 400);
      }
      return { name: name.trim() };
    }),
    async (c) => {
      const userId = c.req.param("userId");
      const { name } = await c.req.json();
      
      try {
        const user = await prisma.user.update({
          where: { id: userId },
          data: { name }
        });
        
        return c.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            updatedAt: user.updatedAt
          },
          message: "Profile updated successfully!"
        });
        
      } catch (error: any) {
        if (error.code === 'P2025') { // Record not found
          return c.json({ error: "User not found" }, 404);
        }
        return c.json({ error: "Failed to update profile" }, 500);
      }
    }
  );



};

// Helper functions
const calculateQuizScore = (answers: any[]): number => {
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  return Math.round((correctAnswers / answers.length) * 100);
};

const calculateStreak = async (userId: string): Promise<number> => {
  const progress = await prisma.userProgress.findMany({
    where: { userId },
    orderBy: { lastReviewed: "desc" },
    select: { lastReviewed: true }
  });

  if (progress.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  
  for (const p of progress) {
    const reviewDate = new Date(p.lastReviewed);
    const daysDiff = Math.floor((currentDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      streak++;
      currentDate = reviewDate;
    } else {
      break;
    }
  }
  
  return streak;
};
