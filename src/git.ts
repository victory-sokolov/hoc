import { execSync } from "child_process";

import type { Hits } from "./types.js";

export class Git {
  private dir: string;
  private exclude: string[];
  private author: string;
  private since: string;
  private before: string;

  constructor(
    dir: string,
    exclude: string[] = [],
    author: string = "",
    since: string = "2000-01-01",
    before: string = new Date().toISOString().split("T")[0],
  ) {
    this.dir = dir;
    this.exclude = exclude;
    this.author = author;
    this.since = since;
    this.before = before;
  }

  async hits(): Promise<Hits[]> {
    try {
      const version = execSync("git --version", { encoding: "utf-8" });
      const versionMatch = version.match(/git version (\d+\.\d+\.\d+)/);
      if (!versionMatch) {
        throw new Error("Unable to parse git version");
      }
      const gitVersion = versionMatch[1];
      const majorVersion = parseInt(gitVersion.split(".")[0]);
      if (majorVersion < 2) {
        throw new Error(
          `git version ${gitVersion} is too old, upgrade it to 2.0+`,
        );
      }
    } catch (err) {
      throw new Error(
        `Git version check failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const cmd = [
      `cd ${this.dir} && git`,
      "log",
      "--pretty=tformat:",
      "--numstat",
      "--ignore-space-change",
      "--ignore-all-space",
      "--ignore-submodules",
      "--no-color",
      "--find-copies-harder",
      "-M",
      "--diff-filter=ACDM",
      `--author=${this.author}`,
      `--since=${this.since}`,
      `--before=${this.before}`,
      "--",
      ".",
      ...this.exclude.map((e) => `':(exclude,glob)${e}'`),
    ].join(" ");

    try {
      const output = execSync(cmd, { encoding: "utf-8" });
      const lines = output.split("\n").filter((line) => line.trim() !== "");

      const total = lines.reduce((sum, line) => {
        const parts = line.split("\t").slice(0, 2);
        const additions = parseInt(parts[0]) || 0;
        const deletions = parseInt(parts[1]) || 0;
        return sum + additions + deletions;
      }, 0);

      return [{ date: new Date(), total }];
    } catch {
      return [{ date: new Date(), total: 0 }];
    }
  }
}
