// src/swagger.ts
export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "English Vocabulary API",
    version: "1.0.0",
    description: "API to generate and fetch difficult English words.",
  },
  paths: {
    "/words": {
      get: {
        summary: "Get paginated list of words",
        responses: {
          200: {
            description: "List of words",
          },
        },
      },
    },
    "/generate-words": {
      post: {
        summary: "Generate and store new words",
        responses: {
          200: {
            description: "Words generated successfully",
          },
        },
      },
    },
    "/trigger-cron": {
      post: {
        summary: "Trigger cron job manually",
        responses: {
          200: {
            description: "Cron triggered",
          },
        },
      },
    },
  },
};
