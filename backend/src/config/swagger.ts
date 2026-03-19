import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "App API",
      version: "1.0.0",
      description: "REST API — nutzbar via Browser, Frontend und PowerShell-Scripts",
    },
    servers: [
      { url: "http://localhost:4000/api/v1", description: "Local Development v1" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Entra ID Access Token (Bearer)",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API Key (erstellt via POST /api/v1/api-keys)",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", description: "Fehlermeldung" },
          },
          required: ["error"],
        },
        ValidationError: {
          type: "object",
          properties: {
            error: { type: "string", example: "Validierungsfehler" },
            details: {
              type: "object",
              description: "Zod Validation Details",
            },
          },
          required: ["error"],
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: {} },
            total: { type: "integer" },
            limit: { type: "integer" },
            offset: { type: "integer" },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Validierungsfehler",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationError" },
            },
          },
        },
        Unauthorized: {
          description: "Nicht authentifiziert",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "Authorization header mit Bearer Token erforderlich" },
            },
          },
        },
        Forbidden: {
          description: "Keine Berechtigung",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "Keine Berechtigung für diese Aktion" },
            },
          },
        },
        NotFound: {
          description: "Ressource nicht gefunden",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Conflict: {
          description: "Konflikt (z.B. Duplikat)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "E-Mail bereits vergeben" },
            },
          },
        },
        TooManyRequests: {
          description: "Rate Limit erreicht",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
              example: { error: "Zu viele Anfragen — bitte warten" },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
