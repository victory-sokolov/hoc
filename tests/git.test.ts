import { execSync } from "child_process";
import { mkdtempSync, rmSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "bun:test";
import { Git } from "../src/git.js";

describe("Git", () => {
    const createTempGitRepo = (withCommits = true): string => {
        const dir = mkdtempSync(join(tmpdir(), "hoc-test-"));

        try {
            execSync("git init --quiet .", { cwd: dir });
            execSync("git config user.email test@zerocracy.com", { cwd: dir });
            execSync("git config user.name test", { cwd: dir });

            if (withCommits) {
                execSync("echo 'hello, world!' > test.txt", { cwd: dir });
                execSync("git add test.txt", { cwd: dir });
                execSync('git commit -qam "add line"', { cwd: dir });
                execSync("echo 'good bye, world!' > test.txt", { cwd: dir });
                execSync('git commit -qam "modify line"', { cwd: dir });
                execSync("rm test.txt", { cwd: dir });
                execSync("git add test.txt", { cwd: dir });
                execSync('git commit -qam "delete line"', { cwd: dir });
            }

            return dir;
        } catch (error) {
            rmSync(dir, { recursive: true, force: true });
            throw error;
        }
    };

    describe("hits", () => {
        it("should calculate hits from a git repository", async () => {
            const dir = createTempGitRepo();

            try {
                const git = new Git(
                    dir,
                    [],
                    "",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(4);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should return 0 hits for an empty git repository", async () => {
            const dir = createTempGitRepo(false);

            try {
                const git = new Git(
                    dir,
                    [],
                    "",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(0);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should ignore binary files", async () => {
            const dir = createTempGitRepo(false);

            try {
                execSync("dd if=/dev/urandom of=test.dat bs=1 count=65536", {
                    cwd: dir,
                    stdio: "pipe",
                });
                execSync("git add test.dat", { cwd: dir });
                execSync('git commit -qam "binary file"', { cwd: dir });
                execSync("dd if=/dev/urandom of=test.dat bs=1 count=65536", {
                    cwd: dir,
                    stdio: "pipe",
                });
                execSync("git add test.dat", { cwd: dir });
                execSync('git commit -qam "binary file modified"', {
                    cwd: dir,
                });

                const git = new Git(
                    dir,
                    [],
                    "",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(0);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should filter by author", async () => {
            const dir = createTempGitRepo(false);

            try {
                execSync("echo 'line 1' > test.txt", { cwd: dir });
                execSync("git add test.txt", { cwd: dir });
                execSync('git commit -qam "add by user1"', { cwd: dir });

                execSync("git config user.email user2@test.com", { cwd: dir });
                execSync("git config user.name user2", { cwd: dir });
                execSync("echo 'line 2' >> test.txt", { cwd: dir });
                execSync("git add test.txt", { cwd: dir });
                execSync('git commit -qam "add by user2"', { cwd: dir });

                const git = new Git(
                    dir,
                    [],
                    "user1@test.com",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(1);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should filter by date range", async () => {
            const dir = createTempGitRepo(false);

            try {
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

                const git = new Git(dir, [], "", "2021-01-01", "2021-12-31");
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(1);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should exclude files matching glob patterns", async () => {
            const dir = createTempGitRepo(false);

            try {
                mkdirSync(join(dir, "src"), { recursive: true });
                execSync("echo 'line 1' > src/test.txt", { cwd: dir });
                execSync("git add src/test.txt", { cwd: dir });
                execSync('git commit -qam "add src"', { cwd: dir });

                mkdirSync(join(dir, "vendor"), { recursive: true });
                execSync("echo 'line 2' > vendor/test.txt", { cwd: dir });
                execSync("git add vendor/test.txt", { cwd: dir });
                execSync('git commit -qam "add vendor"', { cwd: dir });

                const git = new Git(
                    dir,
                    ["vendor/**"],
                    "",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(1);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should handle multiple exclude patterns", async () => {
            const dir = createTempGitRepo(false);

            try {
                mkdirSync(join(dir, "src"), { recursive: true });
                execSync("echo 'line 1' > src/test.txt", { cwd: dir });
                execSync("git add src/test.txt", { cwd: dir });
                execSync('git commit -qam "add src"', { cwd: dir });

                mkdirSync(join(dir, "vendor"), { recursive: true });
                execSync("echo 'line 2' > vendor/test.txt", { cwd: dir });
                execSync("git add vendor/test.txt", { cwd: dir });
                execSync('git commit -qam "add vendor"', { cwd: dir });

                mkdirSync(join(dir, "node_modules"), { recursive: true });
                execSync("echo 'line 3' > node_modules/test.txt", { cwd: dir });
                execSync("git add node_modules/test.txt", { cwd: dir });
                execSync('git commit -qam "add node_modules"', { cwd: dir });

                const git = new Git(
                    dir,
                    ["vendor/**", "node_modules/**"],
                    "",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(1);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should handle multiple files in a single commit", async () => {
            const dir = createTempGitRepo(false);

            try {
                execSync("echo 'line 1' > file1.txt", { cwd: dir });
                execSync("echo 'line 2' > file2.txt", { cwd: dir });
                execSync("git add file1.txt file2.txt", { cwd: dir });
                execSync('git commit -qam "add multiple files"', { cwd: dir });

                const git = new Git(
                    dir,
                    [],
                    "",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(2);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should handle multiple commits", async () => {
            const dir = createTempGitRepo(false);

            try {
                for (let i = 0; i < 5; i++) {
                    execSync(`echo 'line ${i}' > test.txt`, { cwd: dir });
                    execSync("git add test.txt", { cwd: dir });
                    execSync('git commit -qam "commit"', { cwd: dir });
                }

                const git = new Git(
                    dir,
                    [],
                    "",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBeGreaterThan(0);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should handle files with both additions and deletions", async () => {
            const dir = createTempGitRepo(false);

            try {
                execSync("echo 'line 1\nline 2\nline 3' > test.txt", {
                    cwd: dir,
                });
                execSync("git add test.txt", { cwd: dir });
                execSync('git commit -qam "add"', { cwd: dir });

                execSync("echo 'line 1\nline 3' > test.txt", { cwd: dir });
                execSync("git add test.txt", { cwd: dir });
                execSync('git commit -qam "modify"', { cwd: dir });

                const git = new Git(
                    dir,
                    [],
                    "",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(4);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should return 0 hits when no commits match date range", async () => {
            const dir = createTempGitRepo();

            try {
                const git = new Git(dir, [], "", "2050-01-01", "2050-12-31");
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(0);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should return 0 hits when no commits match author", async () => {
            const dir = createTempGitRepo();

            try {
                const git = new Git(
                    dir,
                    [],
                    "nonexistent",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBe(0);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should have date property set to current time", async () => {
            const dir = createTempGitRepo();

            try {
                const before = new Date();
                const git = new Git(
                    dir,
                    [],
                    "",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();
                const after = new Date();

                expect(hits).toHaveLength(1);
                expect(hits[0].date.getTime()).toBeGreaterThanOrEqual(
                    before.getTime(),
                );
                expect(hits[0].date.getTime()).toBeLessThanOrEqual(
                    after.getTime(),
                );
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it("should handle merge commits correctly", async () => {
            const dir = createTempGitRepo(false);

            try {
                execSync("echo 'line 1' > test.txt", { cwd: dir });
                execSync("git add test.txt", { cwd: dir });
                execSync('git commit -qam "initial"', { cwd: dir });

                execSync("git checkout -b feature", { cwd: dir });
                execSync("echo 'line 2' > feature.txt", { cwd: dir });
                execSync("git add feature.txt", { cwd: dir });
                execSync('git commit -qam "feature"', { cwd: dir });

                execSync("git checkout main", { cwd: dir });
                execSync("echo 'line 3' > main.txt", { cwd: dir });
                execSync("git add main.txt", { cwd: dir });
                execSync('git commit -qam "main change"', { cwd: dir });

                execSync('git merge feature -m "merge"', { cwd: dir });

                const git = new Git(
                    dir,
                    [],
                    "",
                    "2000-01-01",
                    new Date().toISOString().split("T")[0],
                );
                const hits = await git.hits();

                expect(hits).toHaveLength(1);
                expect(hits[0].total).toBeGreaterThan(0);
            } finally {
                rmSync(dir, { recursive: true, force: true });
            }
        });
    });
});
