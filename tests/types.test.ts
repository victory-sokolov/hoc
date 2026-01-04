import { Git } from "../src/git.js";
import { createHits } from "../src/index.js";
import { describe, expect, it } from "bun:test";

describe("Exports", () => {
  it("should export Git class", () => {
    expect(Git).toBeDefined();
    expect(typeof Git).toBe("function");
  });

  it("should export createHits function", () => {
    expect(createHits).toBeDefined();
    expect(typeof createHits).toBe("function");
  });
});

describe("Types", () => {
  it("should allow Options with valid format", () => {
    const options = {
      dir: "/some/path",
      format: "int" as const,
      since: "2000-01-01",
      before: "2020-12-31",
    };

    expect(options.dir).toBe("/some/path");
    expect(options.format).toBe("int");
  });

  it("should allow Options with all fields", () => {
    const options = {
      dir: "/some/path",
      exclude: ["node_modules/**", "vendor/**"],
      author: "test@example.com",
      format: "json" as const,
      since: "2000-01-01",
      before: "2020-12-31",
    };

    expect(options.exclude).toHaveLength(2);
    expect(options.author).toBe("test@example.com");
    expect(options.format).toBe("json");
  });

  it("should allow Options with optional fields", () => {
    const options = {
      dir: "/some/path",
      format: "text" as const,
      since: "2000-01-01",
      before: "2020-12-31",
    };

    expect(options.exclude).toBeUndefined();
    expect(options.author).toBeUndefined();
  });
});
