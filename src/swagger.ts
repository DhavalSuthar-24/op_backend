// Get dynamic base URL based on environment
const getBaseUrl = (): string => {
  // Check if running on Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Check for custom deployment URL
  if (process.env.DEPLOYMENT_URL) {
    return process.env.DEPLOYMENT_URL;
  }
  
  // Check for Next.js environment variables
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  // Production environment check
  if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION_URL) {
    return process.env.PRODUCTION_URL;
  }
  
  // Default to localhost for development
  return process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3001';
};

// Get multiple server configurations
const getServers = () => {
  const baseUrl = getBaseUrl();
  const servers = [
    {
      url: baseUrl,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ];

  // Add additional servers if needed
  if (process.env.NODE_ENV === 'development') {
    servers.push({
      url: 'http://localhost:3001',
      description: 'Local development server'
    });
  }

  return servers;
};

export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Enhanced English Learning API",
    description: "Comprehensive API for English vocabulary learning with multi-language support",
    version: "2.0.0",
    contact: {
      name: "API Support",
      email: "support@englishlearning.com"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: getServers(),
  paths: {
    "/": {
      get: {
        summary: "API Information",
        description: "Get basic API information and available endpoints",
        tags: ["General"],
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
    "/auth/register": {
      post: {
        summary: "Register User",
        description: "Create a new user account",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 50 },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6, maxLength: 100 }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/UserResponse" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid input data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "409": {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Login User",
        description: "Authenticate user and get access token",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/UserResponse" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid input",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/auth/profile": {
      get: {
        summary: "Get User Profile",
        description: "Get authenticated user's profile information",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    user: { $ref: "#/components/schemas/UserProfile" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      put: {
        summary: "Update User Profile",
        description: "Update authenticated user's profile information",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 50 }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    user: { $ref: "#/components/schemas/UserResponse" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid input",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
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
        tags: ["Words"],
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
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 }
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
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
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
        tags: ["Words"],
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Search query",
            schema: { type: "string", minLength: 1 }
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
            description: "Missing query parameter",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/words/{id}": {
      get: {
        summary: "Get Word by ID",
        description: "Get detailed information about a specific word",
        tags: ["Words"],
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
            description: "Word not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/words/{id}/learned": {
      post: {
        summary: "Mark Word as Learned",
        description: "Mark a word as learned for the authenticated user",
        tags: ["Words"],
        security: [{ BearerAuth: [] }],
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
                properties: {}
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
                    message: { type: "string" },
                    success: { type: "boolean" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/quiz/generate": {
      post: {
        summary: "Generate Quiz",
        description: "Generate interactive quiz based on type and difficulty",
        tags: ["Quiz"],
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
                    maximum: 50,
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
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/quiz/submit": {
      post: {
        summary: "Submit Quiz Answers",
        description: "Submit quiz answers and get score",
        tags: ["Quiz"],
        security: [{ BearerAuth: [] }],
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
                    data: { $ref: "#/components/schemas/QuizResult" },
                    success: { type: "boolean" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/daily/quote": {
      get: {
        summary: "Get Daily Quote",
        description: "Retrieve today's inspirational quote",
        tags: ["Daily Content"],
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
        tags: ["Daily Content"],
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
        tags: ["Daily Content"],
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
        tags: ["Stories"],
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
        tags: ["Stories"],
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
        tags: ["Grammar"],
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
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/grammar/topics": {
      get: {
        summary: "Get Grammar Topics",
        description: "Get list of available grammar topics",
        tags: ["Grammar"],
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
        tags: ["Pronunciation"],
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
            description: "Invalid request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/progress": {
      get: {
        summary: "Get User Progress",
        description: "Get learning progress for the authenticated user",
        tags: ["Progress"],
        security: [{ BearerAuth: [] }],
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
                    },
                    success: { type: "boolean" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/widget/word/next": {
      get: {
        summary: "Get Next Word for Widget",
        description: "Get next word for widget display",
        tags: ["Widget"],
        parameters: [
          {
            name: "userId",
            in: "query",
            description: "User ID (optional)",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Next word for widget",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Word" }
                  }
                }
              }
            }
          },
          "404": {
            description: "No word available",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
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
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Words generated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    success: { type: "boolean" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
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
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Daily content generated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    success: { type: "boolean" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
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
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "API statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/ApiStats" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
          success: { type: "boolean", default: false }
        }
      },
      UserResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          username: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      UserProfile: {
        allOf: [
          { $ref: "#/components/schemas/UserResponse" },
          {
            type: "object",
            properties: {
              stats: {
                type: "object",
                properties: {
                  wordsLearned: { type: "integer" },
                  totalBadges: { type: "integer" },
                  quizzesCompleted: { type: "integer" },
                  currentStreak: { type: "integer" },
                  longestStreak: { type: "integer" },
                  memberSince: { type: "string", format: "date-time" }
                }
              },
              recentBadges: {
                type: "array",
                items: { $ref: "#/components/schemas/UserBadge" }
              }
            }
          }
        ]
      },
      UserBadge: {
        type: "object",
        properties: {
          id: { type: "string" },
          badgeType: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          icon: { type: "string", nullable: true },
          earnedAt: { type: "string", format: "date-time" }
        }
      },
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
      name: "General",
      description: "General API information"
    },
    {
      name: "Authentication",
      description: "User authentication and profile management"
    },
    {
      name: "Words",
      description: "Vocabulary management and word operations"
    },
    {
      name: "Quiz",
      description: "Interactive quizzes and assessments"
    },
    {
      name: "Daily Content",
      description: "Daily quotes, facts, and featured words"
    },
    {
      name: "Stories",
      description: "Educational stories with vocabulary integration"
    },
    {
      name: "Grammar",
      description: "Grammar lessons and topics"
    },
    {
      name: "Pronunciation",
      description: "Pronunciation guides and phonetics"
    },
    {
      name: "Progress",
      description: "User progress tracking and statistics"
    },
    {
      name: "Widget",
      description: "Widget endpoints for external integrations"
    },
    {
      name: "Admin",
      description: "Administrative functions and system management"
    }
  ]
};

// Export additional utility functions for dynamic configuration
export const getApiBaseUrl = getBaseUrl;
export const getApiServers = getServers;

// Helper function to get environment-specific configuration
export const getSwaggerConfig = () => ({
  ...swaggerDocument,
  servers: getServers(),
  info: {
    ...swaggerDocument.info,
    description: `${swaggerDocument.info.description} - Environment: ${process.env.NODE_ENV || 'development'}`
  }
});