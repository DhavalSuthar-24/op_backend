export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Enhanced English Learning API",
    description: "Comprehensive API for English vocabulary learning with multi-language support",
    version: "2.0.0",
    contact: {
      name: "API Support",
      email: "support@englishlearning.com"
    }
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Development server"
    }
  ],
  paths: {
    "/": {
      get: {
        summary: "API Information",
        description: "Get basic API information and available endpoints",
        responses: {
          "200": {
            description: "API information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    version: { type: "string" },
                    endpoints: {
                      type: "array",
                      items: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/words": {
      get: {
        summary: "Get Vocabulary Words",
        description: "Retrieve paginated list of vocabulary words with filters",
        parameters: [
          {
            name: "cursor",
            in: "query",
            description: "Pagination cursor",
            schema: { type: "string" }
          },
          {
            name: "limit",
            in: "query",
            description: "Number of words to return (max 100)",
            schema: { type: "integer", maximum: 100, default: 20 }
          },
          {
            name: "difficulty",
            in: "query",
            description: "Filter by difficulty level",
            schema: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
          },
          {
            name: "category",
            in: "query",
            description: "Filter by category",
            schema: { type: "string", enum: ["academic", "business", "technology", "science", "literature", "casual", "general"] }
          }
        ],
        responses: {
          "200": {
            description: "List of vocabulary words",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Word" }
                    },
                    nextCursor: { type: "string", nullable: true },
                    hasMore: { type: "boolean" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/words/search": {
      get: {
        summary: "Search Words",
        description: "Search vocabulary words by text, meaning, or synonyms",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Search query",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Word" }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Missing query parameter"
          }
        }
      }
    },
    "/words/{id}": {
      get: {
        summary: "Get Word by ID",
        description: "Get detailed information about a specific word",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Word ID",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Word details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/WordDetailed" }
                  }
                }
              }
            }
          },
          "404": {
            description: "Word not found"
          }
        }
      }
    },
    "/words/{id}/learned": {
      post: {
        summary: "Mark Word as Learned",
        description: "Mark a word as learned for a user",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Word ID",
            schema: { type: "string" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId"],
                properties: {
                  userId: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Word marked as learned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid request"
          }
        }
      }
    },
    "/quiz/generate": {
      post: {
        summary: "Generate Quiz",
        description: "Generate interactive quiz based on type and difficulty",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type"],
                properties: {
                  type: {
                    type: "string",
                    enum: ["multiple-choice", "fill-in-the-blank", "synonym-match", "definition-match", "sentence-completion"]
                  },
                  difficulty: {
                    type: "string",
                    enum: ["beginner", "intermediate", "advanced"],
                    default: "intermediate"
                  },
                  count: {
                    type: "integer",
                    minimum: 5,
                    maximum: 20,
                    default: 10
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Generated quiz",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Quiz" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid request"
          }
        }
      }
    },
    "/quiz/submit": {
      post: {
        summary: "Submit Quiz Answers",
        description: "Submit quiz answers and get score",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["answers"],
                properties: {
                  answers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        questionId: { type: "string" },
                        answer: { type: "string" },
                        isCorrect: { type: "boolean" }
                      }
                    }
                  },
                  userId: { type: "string" },
                  quizId: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Quiz results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/QuizResult" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid request"
          }
        }
      }
    },
    "/daily/quote": {
      get: {
        summary: "Get Daily Quote",
        description: "Retrieve today's inspirational quote",
        responses: {
          "200": {
            description: "Daily quote",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/DailyQuote" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/daily/fact": {
      get: {
        summary: "Get Fact of the Day",
        description: "Retrieve today's educational fact",
        responses: {
          "200": {
            description: "Fact of the day",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/FactOfTheDay" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/daily/word": {
      get: {
        summary: "Get Word of the Day",
        description: "Retrieve today's featured word",
        responses: {
          "200": {
            description: "Word of the day",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/WordDetailed" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/stories/generate": {
      post: {
        summary: "Generate Story",
        description: "Generate educational story with vocabulary words",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  theme: {
                    type: "string",
                    default: "adventure",
                    enum: ["adventure", "friendship", "mystery", "science", "history", "fantasy"]
                  },
                  difficulty: {
                    type: "string",
                    enum: ["beginner", "intermediate", "advanced"],
                    default: "intermediate"
                  },
                  wordsToInclude: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Generated story",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Story" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/stories": {
      get: {
        summary: "Get Stories",
        description: "Get list of saved stories",
        responses: {
          "200": {
            description: "List of stories",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Story" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/grammar/lesson": {
      post: {
        summary: "Generate Grammar Lesson",
        description: "Create comprehensive grammar lesson on specific topic",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["topic"],
                properties: {
                  topic: {
                    type: "string",
                    description: "Grammar topic to teach"
                  },
                  difficulty: {
                    type: "string",
                    enum: ["beginner", "intermediate", "advanced"],
                    default: "intermediate"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Grammar lesson",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/GrammarLesson" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid request"
          }
        }
      }
    },
    "/grammar/topics": {
      get: {
        summary: "Get Grammar Topics",
        description: "Get list of available grammar topics",
        responses: {
          "200": {
            description: "List of grammar topics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/pronunciation/guide": {
      post: {
        summary: "Generate Pronunciation Guide",
        description: "Generate pronunciation guide for a specific word",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["word"],
                properties: {
                  word: {
                    type: "string",
                    description: "Word to generate pronunciation guide for"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Pronunciation guide",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/PronunciationGuide" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid request"
          }
        }
      }
    },
    "/progress/{userId}": {
      get: {
        summary: "Get User Progress",
        description: "Get learning progress for a specific user",
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            description: "User ID",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "User progress",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        progress: {
                          type: "array",
                          items: { $ref: "#/components/schemas/UserProgress" }
                        },
                        stats: { $ref: "#/components/schemas/UserStats" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admin/generate-words": {
      post: {
        summary: "Generate Words (Admin)",
        description: "Manually trigger word generation",
        responses: {
          "200": {
            description: "Words generated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admin/generate-daily-content": {
      post: {
        summary: "Generate Daily Content (Admin)",
        description: "Manually trigger daily content generation",
        responses: {
          "200": {
            description: "Daily content generated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/admin/stats": {
      get: {
        summary: "Get API Statistics (Admin)",
        description: "Get comprehensive API usage statistics",
        responses: {
          "200": {
            description: "API statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/ApiStats" }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Word: {
        type: "object",
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          meaningHindi: { type: "string" },
          meaningGujarati: { type: "string" },
          pronunciation: { type: "string", nullable: true },
          partOfSpeech: { type: "string", nullable: true },
          difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          category: { type: "string" },
          etymology: { type: "string", nullable: true },
          mnemonicTrick: { type: "string", nullable: true },
          synonyms: {
            type: "array",
            items: { type: "string" }
          },
          antonyms: {
            type: "array",
            items: { type: "string" }
          },
          sentences: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                difficulty: { type: "string" }
              }
            }
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      WordDetailed: {
        allOf: [
          { $ref: "#/components/schemas/Word" },
          {
            type: "object",
            properties: {
              userProgress: {
                type: "array",
                items: { $ref: "#/components/schemas/UserProgress" }
              },
              commonMistakes: {
                type: "array",
                items: { type: "string" },
                nullable: true
              },
              relatedWords: {
                type: "array",
                items: { type: "string" },
                nullable: true
              },
              isWordOfTheDay: { type: "boolean" }
            }
          }
        ]
      },
      Quiz: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string" },
          difficulty: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                question: { type: "string" },
                options: {
                  type: "array",
                  items: { type: "string" }
                },
                correctAnswer: { type: "string" },
                explanation: { type: "string" }
              }
            }
          },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      QuizResult: {
        type: "object",
        properties: {
          id: { type: "string" },
          quizId: { type: "string" },
          userId: { type: "string" },
          answers: { type: "string" },
          score: { type: "integer" },
          completedAt: { type: "string", format: "date-time" }
        }
      },
      DailyQuote: {
        type: "object",
        properties: {
          id: { type: "string" },
          quote: { type: "string" },
          author: { type: "string" },
          hindiTranslation: { type: "string", nullable: true },
          gujaratiTranslation: { type: "string", nullable: true },
          explanation: { type: "string", nullable: true },
          relevanceToLearning: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      FactOfTheDay: {
        type: "object",
        properties: {
          id: { type: "string" },
          fact: { type: "string" },
          topic: { type: "string" },
          hindiTranslation: { type: "string", nullable: true },
          gujaratiTranslation: { type: "string", nullable: true },
          explanation: { type: "string", nullable: true },
          didYouKnow: { type: "string", nullable: true },
          source: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      Story: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          content: { type: "string" },
          theme: { type: "string" },
          difficulty: { type: "string" },
          moralLesson: { type: "string", nullable: true },
          vocabularyHighlights: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          comprehensionQuestions: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          hindiSummary: { type: "string", nullable: true },
          gujaratiSummary: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      GrammarLesson: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          topic: { type: "string" },
          difficulty: { type: "string" },
          explanation: { type: "string" },
          rules: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          examples: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          commonMistakes: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          practiceExercises: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          tips: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          hindiExplanation: { type: "string", nullable: true },
          gujaratiExplanation: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      PronunciationGuide: {
        type: "object",
        properties: {
          id: { type: "string" },
          word: { type: "string" },
          ipa: { type: "string", nullable: true },
          syllables: { type: "string", nullable: true },
          stress: { type: "string", nullable: true },
          soundTips: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          similarSounds: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          commonErrors: {
            type: "array",
            items: { type: "string" },
            nullable: true
          },
          practicePhrase: { type: "string", nullable: true },
          audioDescription: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      UserProgress: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          wordId: { type: "string" },
          word: { $ref: "#/components/schemas/Word" },
          isLearned: { type: "boolean" },
          reviewCount: { type: "integer" },
          lastReviewed: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      UserStats: {
        type: "object",
        properties: {
          totalWords: { type: "integer" },
          learnedWords: { type: "integer" },
          streakDays: { type: "integer" },
          averageReviewCount: { type: "number" }
        }
      },
      ApiStats: {
        type: "object",
        properties: {
          totalWords: { type: "integer" },
          totalQuizzes: { type: "integer" },
          totalUsers: { type: "integer" },
          lastUpdated: { type: "string", format: "date-time" }
        }
      }
    }
  },
  tags: [
    {
      name: "Words",
      description: "Vocabulary management"
    },
    {
      name: "Quiz",
      description: "Interactive quizzes"
    },
    {
      name: "Daily Content",
      description: "Daily quotes, facts, and words"
    },
    {
      name: "Stories",
      description: "Educational stories"
    },
    {
      name: "Grammar",
      description: "Grammar lessons"
    },
    {
      name: "Pronunciation",
      description: "Pronunciation guides"
    },
    {
      name: "Progress",
      description: "User progress tracking"
    },
    {
      name: "Admin",
      description: "Administrative functions"
    }
  ]
};