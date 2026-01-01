#!/usr/bin/env node
/*
  Build-time OpenAPI generator using swagger-jsdoc.
  Scans JSDoc in app/api and writes public/openapi.json
*/
import fs from "fs";
import path from "path";

// Prefer direct dependency if present, but this will also work via hoisted dep
import swaggerJSDoc from "swagger-jsdoc";

const root = process.cwd();
const outFile = path.join(root, "public", "openapi.json");

const servers = [
  {
    url: process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000",
    description: process.env.NODE_ENV === "production" ? "Production server" : "Development server",
  },
];

const definition = {
  openapi: "3.0.0",
  info: {
    title: "E-commerce Web API",
    version: "1.0.0",
    description: `\n## E-commerce Web Platform API Documentation\n\nThis API provides comprehensive endpoints for managing an e-commerce platform including:\n- **Authentication & Authorization** - JWT-based authentication with role-based access control\n- **User Management** - Complete user CRUD operations with admin privileges\n- **Admin Functions** - Administrative tools and management features\n- **Notifications** - Real-time notification system\n- **Health Checks** - System monitoring and health endpoints\n\n### Authentication\nMost endpoints require authentication via JWT token. Include the token in the Authorization header:\n\`Authorization: Bearer your-jwt-token\`\n\n### Rate Limiting\nSome endpoints (like login) have rate limiting applied to prevent abuse.\n\n### Roles\n- **USER**: Regular user with basic permissions\n- **ADMIN**: Administrative user with elevated permissions\n- **SUPER_ADMIN**: Super administrator with full system access\n      `,
    contact: {
      name: "E-commerce Web API Support",
      email: "support@ecommerce-web.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers,
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format: Bearer {token}",
      },
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "access_token",
        description: "Authentication via HTTP-only cookie",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          email: { type: "string", format: "email", example: "user@example.com" },
          name: { type: "string", example: "John Doe" },
          role: {
            type: "string",
            enum: ["SUPER_ADMIN", "ADMIN", "USER"],
            example: "USER",
          },
          needs_password_change: { type: "boolean", example: false },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      UserListResponse: {
        type: "object",
        properties: {
          users: { type: "array", items: { $ref: "#/components/schemas/User" } },
          total: { type: "integer", example: 100 },
          page: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 20 },
          totalPages: { type: "integer", example: 5 },
        },
      },
      CreateUserRequest: {
        type: "object",
        required: ["name", "email", "role"],
        properties: {
          name: { type: "string", example: "Jane Smith" },
          email: { type: "string", format: "email", example: "jane@example.com" },
          role: {
            type: "string",
            enum: ["ADMIN", "USER"],
            example: "USER",
            description: "User role (SUPER_ADMIN can only be assigned by existing SUPER_ADMIN)",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", minLength: 6, example: "password123" },
          rememberMe: { type: "boolean", example: false, description: "Extended session duration" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          needs_password_change: { type: "boolean", example: false },
        },
        description: "Authentication tokens are set as HTTP-only cookies",
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: { type: "string", example: "reset-token-here" },
          password: { type: "string", minLength: 6, example: "newpassword123" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", example: "oldpassword123" },
          newPassword: { type: "string", minLength: 6, example: "newpassword123" },
        },
      },
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation successful" },
          data: { type: "object", nullable: true },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Error message" },
          data: { type: "object", nullable: true },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "object",
            additionalProperties: { type: "array", items: { type: "string" } },
            example: {
              email: ["Email is required", "Email must be valid"],
              password: ["Password must be at least 6 characters"],
            },
          },
        },
      },
      HealthStatus: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          timestamp: { type: "string", format: "date-time" },
          database: { type: "string", example: "connected" },
          redis: { type: "string", example: "connected" },
        },
      },
    },
    parameters: {
      PageParam: {
        name: "page",
        in: "query",
        description: "Page number (starts from 1)",
        required: false,
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      PageSizeParam: {
        name: "pageSize",
        in: "query",
        description: "Number of items per page (max 100)",
        required: false,
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
      SearchParam: {
        name: "q",
        in: "query",
        description: "Search query string",
        required: false,
        schema: { type: "string" },
      },
    },
    responses: {
      Unauthorized: {
        description: "Authentication required",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "Authentication required", data: null },
          },
        },
      },
      Forbidden: {
        description: "Insufficient permissions",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "Forbidden", data: null },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "Resource not found", data: null },
          },
        },
      },
      ValidationError: {
        description: "Validation error",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } },
      },
      RateLimitExceeded: {
        description: "Rate limit exceeded",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { success: false, message: "Too many requests", data: null },
          },
        },
      },
    },
  },
  tags: [
    { name: "Authentication", description: "User authentication and session management" },
    { name: "Users", description: "User management operations (Admin only)" },
    { name: "Profile", description: "User profile management" },
    { name: "Admin", description: "Administrative functions" },
    { name: "Health", description: "System health checks" },
    { name: "Notifications", description: "Notification management" },
  ],
  security: [{ BearerAuth: [] }, { CookieAuth: [] }],
};

const options = {
  definition,
  // Scan all API route files for @swagger JSDoc
  apis: [path.join(root, "app", "api", "**", "*.ts")],
};

const spec = swaggerJSDoc(options);

// --- Augment spec with auto-discovered routes (no JSDoc needed) ---
const apiRoot = path.join(root, "app", "api");

function listRouteFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listRouteFiles(full));
    else if (entry.isFile() && entry.name === "route.ts") files.push(full);
  }
  return files;
}

function toOpenApiPath(file) {
  // Convert app/api/users/[id]/route.ts -> /api/users/{id}
  const rel = path.relative(apiRoot, path.dirname(file));
  const segs = rel.split(path.sep).filter(Boolean);
  const mapped = segs.map((s) => {
    if (s.startsWith("[[...") && s.endsWith("]]")) return `{${s.slice(5, -2)}}`;
    if (s.startsWith("[...") && s.endsWith("]")) return `{${s.slice(4, -1)}}`;
    if (s.startsWith("[") && s.endsWith("]")) return `{${s.slice(1, -1)}}`;
    return s;
  });
  return "/" + ["api", ...mapped].join("/");
}

function detectMethods(file) {
  const src = fs.readFileSync(file, "utf-8");
  const methods = new Set();
  const re = /export\s+(?:const\s+|async\s+function\s+|function\s+)(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    methods.add(m[1].toUpperCase());
  }
  return Array.from(methods);
}

function ensureTag(spec, tagName, description = undefined) {
  spec.tags = spec.tags || [];
  if (!spec.tags.some((t) => t.name === tagName)) spec.tags.push({ name: tagName, description });
}

function addDefaultOp(spec, pathStr, method, tagName) {
  const methodLower = method.toLowerCase();
  spec.paths = spec.paths || {};
  spec.paths[pathStr] = spec.paths[pathStr] || {};
  if (spec.paths[pathStr][methodLower]) return; // already documented via JSDoc

  // Path params
  const paramMatches = Array.from(pathStr.matchAll(/\{([^}]+)\}/g)).map((m) => m[1]);
  const parameters = paramMatches.map((name) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
  }));

  spec.paths[pathStr][methodLower] = {
    tags: [tagName],
    summary: `${method} ${pathStr}`,
    parameters: parameters.length ? parameters : undefined,
    responses: {
      200: { description: "OK" },
    },
  };
}

const routeFiles = listRouteFiles(apiRoot);
for (const file of routeFiles) {
  const pathStr = toOpenApiPath(file);
  const methods = detectMethods(file);
  if (!methods.length) continue;
  // Derive tag from first segment after /api
  const firstSeg = pathStr.split("/")[2] || "General";
  const tagName = firstSeg.charAt(0).toUpperCase() + firstSeg.slice(1);
  ensureTag(spec, tagName);
  for (const method of methods) addDefaultOp(spec, pathStr, method, tagName);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(spec, null, 2));
console.log(`[swagger-jsdoc] Wrote OpenAPI to ${path.relative(root, outFile)}`);
