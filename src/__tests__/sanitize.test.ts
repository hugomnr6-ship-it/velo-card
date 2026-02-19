import { describe, it, expect } from "vitest";
import { sanitizeText, sanitizeLikeInput } from "@/lib/sanitize";

describe("sanitizeText", () => {
  it("escapes HTML tags", () => {
    expect(sanitizeText("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;");
  });

  it("escapes ampersands", () => {
    expect(sanitizeText("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes double quotes", () => {
    expect(sanitizeText('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(sanitizeText("it's")).toBe("it&#x27;s");
  });

  it("leaves normal text unchanged", () => {
    expect(sanitizeText("Hello World 123")).toBe("Hello World 123");
  });
});

describe("sanitizeLikeInput", () => {
  it("removes percent signs", () => {
    expect(sanitizeLikeInput("foo%bar")).toBe("foobar");
  });

  it("removes underscores", () => {
    expect(sanitizeLikeInput("foo_bar")).toBe("foobar");
  });

  it("removes backslashes", () => {
    expect(sanitizeLikeInput("foo\\bar")).toBe("foobar");
  });

  it("leaves normal text unchanged", () => {
    expect(sanitizeLikeInput("Hello World 123")).toBe("Hello World 123");
  });
});
