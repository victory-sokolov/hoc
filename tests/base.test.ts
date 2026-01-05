import { Base } from "../src/base.js";
import { execSync } from "child_process";
import { mkdtempSync, rmSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "bun:test";

describe("Base", () => {
    const createTempGitRepo = (): string => {
        const dir = mkdtempSync(join(tmpdir(), "hoc-test-"));

        try {
            execSync("git init --quiet .", { cwd: dir });
            execSync("git config user.email test@zerocracy.com", { cwd: dir });
            execSync("git config user.name test", { cwd: dir });
            execSync("echo 'hello, world!' > test.txt", { cwd: dir });
            execSync("git add test.txt", { cwd: dir });
            execSync('git commit -qam "add line"', { cwd: dir });

            return dir;
        } catch (error) {
            rmSync(dir, { recursive: true, force: true });
            throw error;
        }
    };

    const createTempDir = (): string => {
        return mkdtempSync(join(tmpdir(), "hoc-test-"));
    };

    describe("constructor", () => {
        it("should initialize with default values", () => {
            const base = new Base({
                dir: ".",
                format: "int",
                since: "2000-01-01",
                before: new Date().toISOString().split("T")[0],
            });

            expect(base).toBeDefined();
        });

        it("should initialize with custom values", () => {
            const base = new Base({
                dir: "/some/path",
                exclude: ["node_modules/**", "vendor/**"],
                author: "test@example.com",
                format: "json",
                since: "2020-01-01",
                before: "2020-12-31",
            });

            expect(base).toBeDefined();
        });
    });

    describe("report", () => {
        it("should return int format as number", async () => {
            const dir = createTempGitRepo();

            try {
                const base = new Base({
                    dir,
                    exclude: [],
                    author: "",
                    format: "int",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                const report = await base.report();
                expect(report).toBe(1);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should return text format as string", async () => {
            const dir = createTempGitRepo();

            try {
                const base = new Base({
                    dir,
                    exclude: [],
                    author: "",
                    format: "text",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                const report = await base.report();
                expect(report).toBe("Total Hits-of-Code: 1");
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should return xml format as string", async () => {
            const dir = createTempGitRepo();

            try {
                const base = new Base({
                    dir,
                    exclude: [],
                    author: "",
                    format: "xml",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                const report = await base.report();
                expect(report).toBe("<hoc><total>1</total></hoc>");
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should return json format as string", async () => {
            const dir = createTempGitRepo();

            try {
                const base = new Base({
                    dir,
                    exclude: [],
                    author: "",
                    format: "json",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                const report = await base.report();
                expect(report).toBe('{"total":1}');
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should handle zero hits", async () => {
            const dir = createTempDir();

            try {
                execSync("git init --quiet .", { cwd: dir });
                execSync("git config user.email test@zerocracy.com", {
                    cwd: dir,
                });
                execSync("git config user.name test", { cwd: dir });

                const base = new Base({
                    dir,
                    exclude: [],
                    author: "",
                    format: "int",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                const report = await base.report();
                expect(report).toBe(0);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should filter by author", async () => {
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

                const base = new Base({
                    dir,
                    exclude: [],
                    author: "user1@test.com",
                    format: "int",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                const report = await base.report();
                expect(report).toBe(1);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it.skip("should filter by date range", async () => {
            const dir = createTempDir();

            try {
                execSync("git init --quiet .", { cwd: dir });
                execSync("git config user.email test@test.com", { cwd: dir });
                execSync("git config user.name test", { cwd: dir });
                execSync("echo 'line 1' > test.txt", { cwd: dir });
                execSync("git add test.txt", { cwd: dir });
                execSync(
                    'GIT_COMMITTER_DATE="2020-01-01 12:00:00" git commit -qam "add"',
                    {
                        cwd: dir,
                        env: {
                            ...process.env,
                            GIT_COMMITTER_DATE: "2020-01-01 12:00:00",
                            GIT_AUTHOR_DATE: "2020-01-01 12:00:00",
                        },
                    },
                );

                execSync("echo 'line 2' >> test.txt", { cwd: dir });
                execSync("git add test.txt", { cwd: dir });
                execSync(
                    'GIT_COMMITTER_DATE="2021-01-01 12:00:00" git commit -qam "add"',
                    {
                        cwd: dir,
                        env: {
                            ...process.env,
                            GIT_COMMITTER_DATE: "2021-01-01 12:00:00",
                            GIT_AUTHOR_DATE: "2021-01-01 12:00:00",
                        },
                    },
                );

                const base = new Base({
                    dir,
                    exclude: [],
                    author: "",
                    format: "int",
                    since: "2021-01-01",
                    before: "2099-12-31",
                });

                const report = await base.report();
                expect(report).toBe(2);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should exclude files matching patterns", async () => {
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

                const base = new Base({
                    dir,
                    exclude: ["vendor/**"],
                    author: "",
                    format: "int",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                const report = await base.report();
                expect(report).toBe(1);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should handle multiple exclude patterns", async () => {
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
                execSync("git add -f node_modules/test.txt", { cwd: dir });
                execSync('git commit -qam "add"', { cwd: dir });

                const base = new Base({
                    dir,
                    exclude: ["vendor/**", "node_modules/**"],
                    author: "",
                    format: "int",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                const report = await base.report();
                expect(report).toBe(1);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should throw error for non-git directory", async () => {
            const dir = createTempDir();

            try {
                const base = new Base({
                    dir,
                    exclude: [],
                    author: "",
                    format: "int",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                await expect(base.report()).rejects.toThrow(
                    "Only Git repositories supported now",
                );
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should throw error for invalid format", async () => {
            const dir = createTempGitRepo();

            try {
                const base = new Base({
                    dir,
                    exclude: [],
                    author: "",
                    format: "invalid" as any,
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                await expect(base.report()).rejects.toThrow(
                    'Only "text|xml|json|int" formats are supported now',
                );
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should handle multiple commits", async () => {
            const dir = createTempDir();

            try {
                execSync("git init --quiet .", { cwd: dir });
                execSync("git config user.email test@test.com", { cwd: dir });
                execSync("git config user.name test", { cwd: dir });

                for (let i = 0; i < 10; i++) {
                    execSync(`echo 'line ${i}' >> test.txt`, { cwd: dir });
                    execSync("git add test.txt", { cwd: dir });
                    execSync('git commit -qam "add"', { cwd: dir });
                }

                const base = new Base({
                    dir,
                    exclude: [],
                    author: "",
                    format: "int",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                const report = await base.report();
                expect(report).toBeGreaterThan(0);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should parse json output correctly", async () => {
            const dir = createTempGitRepo();

            try {
                const base = new Base({
                    dir,
                    exclude: [],
                    author: "",
                    format: "json",
                    since: "2000-01-01",
                    before: new Date().toISOString().split("T")[0],
                });

                const report = await base.report();
                const parsed = JSON.parse(report as string);
                expect(parsed).toEqual({ total: 1 });
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should handle zero hits with all formats", async () => {
            const dir = createTempDir();

            try {
                execSync("git init --quiet .", { cwd: dir });
                execSync("git config user.email test@test.com", { cwd: dir });
                execSync("git config user.name test", { cwd: dir });

                const formats = ["int", "text", "json", "xml"] as const;

                for (const format of formats) {
                    const base = new Base({
                        dir,
                        exclude: [],
                        author: "",
                        format,
                        since: "2000-01-01",
                        before: new Date().toISOString().split("T")[0],
                    });

                    const report = await base.report();

                    if (format === "int") {
                        expect(report).toBe(0);
                    } else if (format === "text") {
                        expect(report).toBe("Total Hits-of-Code: 0");
                    } else if (format === "json") {
                        expect(report).toBe('{"total":0}');
                    } else if (format === "xml") {
                        expect(report).toBe("<hoc><total>0</total></hoc>");
                    }
                }
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });
    });
});
