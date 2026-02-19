import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

// Mock supabase and auth before importing api-utils
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {},
}));
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import { isValidUUID, AppError, handleApiError, validateBody } from "@/lib/api-utils";

describe("isValidUUID", () => {
  it("accepts valid UUID v4", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("accepts lowercase UUID", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("accepts uppercase UUID", () => {
    expect(isValidUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidUUID("")).toBe(false);
  });

  it("rejects non-UUID string", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
  });

  it("rejects partial UUID", () => {
    expect(isValidUUID("550e8400-e29b-41d4")).toBe(false);
  });

  it("rejects UUID without hyphens", () => {
    expect(isValidUUID("550e8400e29b41d4a716446655440000")).toBe(false);
  });

  it("rejects UUID v1 (wrong version digit)", () => {
    expect(isValidUUID("550e8400-e29b-11d4-a716-446655440000")).toBe(false);
  });
});

describe("AppError", () => {
  it("creates error with code and message", () => {
    const err = new AppError("DUPLICATE", "Already exists");
    expect(err.code).toBe("DUPLICATE");
    expect(err.message).toBe("Already exists");
    expect(err.statusCode).toBe(400);
  });

  it("creates error with custom status code", () => {
    const err = new AppError("NOT_FOUND", "Missing", 404);
    expect(err.statusCode).toBe(404);
  });

  it("is an instance of Error", () => {
    const err = new AppError("TEST", "test");
    expect(err).toBeInstanceOf(Error);
  });

  it("has name AppError", () => {
    const err = new AppError("TEST", "test");
    expect(err.name).toBe("AppError");
  });
});

describe("handleApiError", () => {
  it("returns proper JSON response for AppError", async () => {
    const err = new AppError("FORBIDDEN", "Access denied", 403);
    const response = handleApiError(err, "TEST");
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
    expect(body.error.message).toBe("Access denied");
  });

  it("returns 500 for unknown errors", async () => {
    const response = handleApiError(new Error("DB crash"), "TEST");
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    // Should NOT leak internal error message
    expect(body.error.message).not.toContain("DB crash");
  });

  it("returns 500 for string errors", async () => {
    const response = handleApiError("some string error", "TEST");
    expect(response.status).toBe(500);
  });
});

describe("validateBody", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  it("returns parsed data for valid input", () => {
    const result = validateBody(schema, { name: "Alice", age: 30 });
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("returns Response for invalid input", () => {
    const result = validateBody(schema, { name: "", age: -1 });
    expect(result).toBeInstanceOf(Response);
  });

  it("returns 400 status for validation error", async () => {
    const result = validateBody(schema, { name: "" });
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(400);
      const body = await result.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("includes field path in error", async () => {
    const result = validateBody(schema, { name: "ok", age: "not-a-number" });
    if (result instanceof Response) {
      const body = await result.json();
      expect(body.error.field).toBe("age");
    }
  });
});
