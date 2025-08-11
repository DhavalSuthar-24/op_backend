-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "isLearned" BOOLEAN NOT NULL DEFAULT false,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuizResult" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "wordsLearned" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LearningStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentDays" INTEGER NOT NULL DEFAULT 0,
    "longestDays" INTEGER NOT NULL DEFAULT 0,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Word" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "meaningHindi" TEXT NOT NULL,
    "meaningGujarati" TEXT NOT NULL,
    "pronunciation" TEXT,
    "partOfSpeech" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "category" TEXT NOT NULL DEFAULT 'general',
    "etymology" TEXT,
    "mnemonicTrick" TEXT,
    "commonMistakes" TEXT,
    "relatedWords" TEXT,
    "isWordOfTheDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Synonym" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Synonym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Antonym" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Antonym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sentence" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',

    CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quiz" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyQuote" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "hindiTranslation" TEXT,
    "gujaratiTranslation" TEXT,
    "explanation" TEXT,
    "relevanceToLearning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FactOfTheDay" (
    "id" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "hindiTranslation" TEXT,
    "gujaratiTranslation" TEXT,
    "explanation" TEXT,
    "didYouKnow" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FactOfTheDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Story" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "moralLesson" TEXT,
    "vocabularyHighlights" TEXT,
    "comprehensionQuestions" TEXT,
    "hindiSummary" TEXT,
    "gujaratiSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GrammarLesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "rules" TEXT,
    "examples" TEXT,
    "commonMistakes" TEXT,
    "practiceExercises" TEXT,
    "tips" TEXT,
    "hindiExplanation" TEXT,
    "gujaratiExplanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PronunciationGuide" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "ipa" TEXT,
    "syllables" TEXT,
    "stress" TEXT,
    "soundTips" TEXT,
    "similarSounds" TEXT,
    "commonErrors" TEXT,
    "practicePhrase" TEXT,
    "audioDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PronunciationGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Idiom" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "hindiTranslation" TEXT,
    "gujaratiTranslation" TEXT,
    "examples" TEXT,
    "origin" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Idiom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConversationTopic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "vocabulary" TEXT,
    "culturalTips" TEXT,
    "scenarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WordChallenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "words" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "reward" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT,
    "vocabularyWords" TEXT,
    "comprehensionQuiz" TEXT,
    "hindiSummary" TEXT,
    "gujaratiSummary" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "UserProgress_userId_idx" ON "public"."UserProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_userId_wordId_key" ON "public"."UserProgress"("userId", "wordId");

-- CreateIndex
CREATE INDEX "QuizResult_userId_idx" ON "public"."QuizResult"("userId");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "public"."UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_createdAt_idx" ON "public"."UserSession"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningStreak_userId_key" ON "public"."LearningStreak"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "public"."UserBadge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Word_text_key" ON "public"."Word"("text");

-- CreateIndex
CREATE INDEX "Word_difficulty_idx" ON "public"."Word"("difficulty");

-- CreateIndex
CREATE INDEX "Word_category_idx" ON "public"."Word"("category");

-- CreateIndex
CREATE INDEX "Word_createdAt_idx" ON "public"."Word"("createdAt");

-- CreateIndex
CREATE INDEX "DailyQuote_createdAt_idx" ON "public"."DailyQuote"("createdAt");

-- CreateIndex
CREATE INDEX "FactOfTheDay_createdAt_idx" ON "public"."FactOfTheDay"("createdAt");

-- CreateIndex
CREATE INDEX "FactOfTheDay_topic_idx" ON "public"."FactOfTheDay"("topic");

-- CreateIndex
CREATE INDEX "Story_difficulty_idx" ON "public"."Story"("difficulty");

-- CreateIndex
CREATE INDEX "Story_theme_idx" ON "public"."Story"("theme");

-- CreateIndex
CREATE INDEX "GrammarLesson_topic_idx" ON "public"."GrammarLesson"("topic");

-- CreateIndex
CREATE INDEX "GrammarLesson_difficulty_idx" ON "public"."GrammarLesson"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "PronunciationGuide_word_key" ON "public"."PronunciationGuide"("word");

-- CreateIndex
CREATE UNIQUE INDEX "Idiom_text_key" ON "public"."Idiom"("text");

-- CreateIndex
CREATE INDEX "Idiom_difficulty_idx" ON "public"."Idiom"("difficulty");

-- CreateIndex
CREATE INDEX "Idiom_category_idx" ON "public"."Idiom"("category");

-- CreateIndex
CREATE INDEX "ConversationTopic_difficulty_idx" ON "public"."ConversationTopic"("difficulty");

-- CreateIndex
CREATE INDEX "WordChallenge_isActive_idx" ON "public"."WordChallenge"("isActive");

-- CreateIndex
CREATE INDEX "WordChallenge_difficulty_idx" ON "public"."WordChallenge"("difficulty");

-- CreateIndex
CREATE INDEX "NewsArticle_difficulty_idx" ON "public"."NewsArticle"("difficulty");

-- CreateIndex
CREATE INDEX "NewsArticle_category_idx" ON "public"."NewsArticle"("category");

-- CreateIndex
CREATE INDEX "NewsArticle_publishedAt_idx" ON "public"."NewsArticle"("publishedAt");

-- AddForeignKey
ALTER TABLE "public"."UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserProgress" ADD CONSTRAINT "UserProgress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "public"."Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizResult" ADD CONSTRAINT "QuizResult_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "public"."Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuizResult" ADD CONSTRAINT "QuizResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningStreak" ADD CONSTRAINT "LearningStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Synonym" ADD CONSTRAINT "Synonym_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "public"."Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Antonym" ADD CONSTRAINT "Antonym_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "public"."Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Sentence" ADD CONSTRAINT "Sentence_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "public"."Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;
