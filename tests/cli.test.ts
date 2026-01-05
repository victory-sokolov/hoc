import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from "fs";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { describe, expect, it } from "bun:test";
import { tmpdir } from "os";

const PROJECT_ROOT = dirname(import.meta.dir);

describe("CLI", () => {
  const createTempGitRepo = (withFile = true): string => {
    const dir = mkdtempSync(join(tmpdir(), "hoc-cli-test-"));

    try {
      execSync("git init --quiet .", { cwd: dir });
      execSync("git config user.email test@zerocracy.com", { cwd: dir });
      execSync("git config user.name test", { cwd: dir });

      if (withFile) {
        execSync("echo 'hello, world!' > test.txt", { cwd: dir });
        execSync("git add test.txt", { cwd: dir });
        execSync('git commit -qam "add line"', { cwd: dir });
      }

      return dir;
    } catch (error) {
      rmSync(dir, { recursive: true, force: true });
      throw error;
    }
  };

  const createTempDir = (): string => {
    return mkdtempSync(join(tmpdir(), "hoc-cli-test-"));
  };

  describe("hoc command", () => {
    const runCLI = (args: string, cwd: string): string => {
      const cliPath = join(PROJECT_ROOT, "dist", "cli.js");
      return execSync(`bun ${cliPath} ${args}`, { cwd, encoding: "utf-8" });
    };

    it("should output int format by default", () => {
      const dir = createTempGitRepo();

      try {
        const output = runCLI("-f int", dir);
        expect(output.trim()).toBe("1");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should output text format", () => {
      const dir = createTempGitRepo();

      try {
        const output = runCLI("-f text", dir);
        expect(output.trim()).toBe("Total Hits-of-Code: 1");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should output xml format", () => {
      const dir = createTempGitRepo();

      try {
        const output = runCLI("-f xml", dir);
        expect(output.trim()).toBe("<hoc><total>1</total></hoc>");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should output json format", () => {
      const dir = createTempGitRepo();

      try {
        const output = runCLI("-f json", dir);
        const parsed = JSON.parse(output.trim());
        expect(parsed).toEqual({ total: 1 });
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should accept custom directory", () => {
      const dir = createTempGitRepo();
      const runDir = mkdtempSync(join(tmpdir(), "hoc-cli-run-"));

      try {
        const output = execSync(
          `bun ${join(PROJECT_ROOT, "dist", "cli.js")} -d ${dir} -f int`,
          { cwd: runDir, encoding: "utf-8" },
        );
        expect(output.trim()).toBe("1");
      } finally {
        rmSync(dir, { recursive: true, force: true });
        rmSync(runDir, { recursive: true, force: true });
      }
    });

    it("should accept author filter", () => {
      const dir = createTempDir();

      try {
        execSync("git init --quiet .", { cwd: dir });
        execSync("git config user.email user1@test.com", { cwd: dir });
        execSync("git config user.name user1", { cwd: dir });
        execSync("echo 'line 1' > test.txt", { cwd: dir });
        execSync("git add test.txt", { cwd: dir });
        execSync('git commit -qam "add"', { cwd: dir });

        execSync("git config user.email user2@test.com", { cwd: dir });
        execSync("git config user.name user2", { cwd: dir });
        execSync("echo 'line 2' >> test.txt", { cwd: dir });
        execSync("git add test.txt", { cwd: dir });
        execSync('git commit -qam "add"', { cwd: dir });

        const output = runCLI("-a user1 -f int", dir);
        expect(output.trim()).toBe("1");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should accept date range filter", () => {
      const dir = createTempDir();

      try {
        execSync("git init --quiet .", { cwd: dir });
        execSync("git config user.email test@test.com", { cwd: dir });
        execSync("git config user.name test", { cwd: dir });
        execSync("echo 'line 1' > test.txt", { cwd: dir });
        execSync("git add test.txt", { cwd: dir });
        execSync('git commit -qam "add" --date="2020-01-01"', { cwd: dir });

        execSync("echo 'line 2' >> test.txt", { cwd: dir });
        execSync("git add test.txt", { cwd: dir });
        execSync('git commit -qam "add" --date="2021-01-01"', { cwd: dir });

        const output = runCLI("-s 2021-01-01 -b 2021-12-31 -f int", dir);
        expect(output.trim()).toBe("1");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should accept exclude patterns", () => {
      const dir = createTempDir();

      try {
        execSync("git init --quiet .", { cwd: dir });
        execSync("git config user.email test@test.com", { cwd: dir });
        execSync("git config user.name test", { cwd: dir });
        mkdirSync(join(dir, "src"), { recursive: true });
        execSync("echo 'line 1' > src/test.txt", { cwd: dir });
        execSync("git add src/test.txt", { cwd: dir });
        execSync('git commit -qam "add"', { cwd: dir });

        mkdirSync(join(dir, "vendor"), { recursive: true });
        execSync("echo 'line 2' > vendor/test.txt", { cwd: dir });
        execSync("git add vendor/test.txt", { cwd: dir });
        execSync('git commit -qam "add"', { cwd: dir });

        const output = runCLI("-e vendor/** -f int", dir);
        expect(output.trim()).toBe("1");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should accept multiple exclude patterns", () => {
      const dir = createTempDir();

      try {
        execSync("git init --quiet .", { cwd: dir });
        execSync("git config user.email test@test.com", { cwd: dir });
        execSync("git config user.name test", { cwd: dir });
        mkdirSync(join(dir, "src"), { recursive: true });
        execSync("echo 'line 1' > src/test.txt", { cwd: dir });
        execSync("git add src/test.txt", { cwd: dir });
        execSync('git commit -qam "add"', { cwd: dir });

        mkdirSync(join(dir, "vendor"), { recursive: true });
        execSync("echo 'line 2' > vendor/test.txt", { cwd: dir });
        execSync("git add vendor/test.txt", { cwd: dir });
        execSync('git commit -qam "add"', { cwd: dir });

        mkdirSync(join(dir, "node_modules"), { recursive: true });
        execSync("echo 'line 3' > node_modules/test.txt", { cwd: dir });
        execSync("git add node_modules/test.txt", { cwd: dir });
        execSync('git commit -qam "add"', { cwd: dir });

        const output = runCLI("-e vendor/** -e node_modules/** -f int", dir);
        expect(output.trim()).toBe("1");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should load config from .hoc file", () => {
      const dir = createTempGitRepo();

      try {
        writeFileSync(join(dir, ".hoc"), "-f text", "utf-8");
        const output = runCLI("", dir);
        expect(output.trim()).toBe("Total Hits-of-Code: 1");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should merge config from .hoc file with CLI args", () => {
      const dir = createTempGitRepo();

      try {
        writeFileSync(join(dir, ".hoc"), "-e vendor/**", "utf-8");
        mkdirSync(join(dir, "vendor"), { recursive: true });
        execSync("echo 'line 2' > vendor/test.txt", { cwd: dir });
        execSync("git add vendor/test.txt", { cwd: dir });
        execSync('git commit -qam "add"', { cwd: dir });

        const output = runCLI("-f int", dir);
        expect(output.trim()).toBe("1");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should handle .hoc file with multiple options", () => {
      const dir = createTempDir();

      try {
        execSync("git init --quiet .", { cwd: dir });
        execSync("git config user.email test@test.com", { cwd: dir });
        execSync("git config user.name test", { cwd: dir });
        mkdirSync(join(dir, "src"), { recursive: true });
        execSync("echo 'line 1' > src/test.txt", { cwd: dir });
        execSync("git add src/test.txt", { cwd: dir });
        execSync('git commit -qam "add"', { cwd: dir });

        mkdirSync(join(dir, "vendor"), { recursive: true });
        execSync("echo 'line 2' > vendor/test.txt", { cwd: dir });
        execSync("git add vendor/test.txt", { cwd: dir });
        execSync('git commit -qam "add"', { cwd: dir });

        writeFileSync(join(dir, ".hoc"), "-f text -e vendor/**", "utf-8");
        const output = runCLI("", dir);
        expect(output.trim()).toBe("Total Hits-of-Code: 1");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should error for non-git directory", () => {
      const dir = mkdtempSync(join(tmpdir(), "hoc-cli-test-"));

      try {
        expect(() => {
          runCLI("-f int", dir);
        }).toThrow();
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should handle zero hits", () => {
      const dir = createTempGitRepo(false);

      try {
        const output = runCLI("-f int", dir);
        expect(output.trim()).toBe("0");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should output help with -h flag", () => {
      const dir = mkdtempSync(join(tmpdir(), "hoc-cli-test-"));

      try {
        const output = runCLI("-h", dir);
        expect(output).toContain("--format");
        expect(output).toContain("--exclude");
        expect(output).toContain("--author");
        expect(output).toContain("--dir");
        expect(output).toContain("--since");
        expect(output).toContain("--before");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it("should output version with -V flag", () => {
      const dir = mkdtempSync(join(tmpdir(), "hoc-cli-test-"));

      try {
        const output = runCLI("-V", dir);
        expect(output).toContain("0.1.0");
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});
