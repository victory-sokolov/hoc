import { existsSync } from "fs";
import { Git } from "./git.js";
import type { Options } from "./types.js";

export class Base {
  private dir: string;
  private exclude: string[];
  private author: string;
  private format: Options["format"];
  private since: string;
  private before: string;

  constructor(opts: Options) {
    this.dir = opts.dir;
    this.exclude = opts.exclude || [];
    this.author = opts.author || "";
    this.format = opts.format;
    this.since = opts.since;
    this.before = opts.before;
  }

  async report(): Promise<string | number> {
    if (!existsSync(`${this.dir}/.git`)) {
      throw new Error("Only Git repositories supported now");
    }

    const git = new Git(
      this.dir,
      this.exclude,
      this.author,
      this.since,
      this.before,
    );
    const hits = await git.hits();
    const count = hits.reduce((sum, hit) => sum + hit.total, 0);

    switch (this.format) {
      case "xml":
        return `<hoc><total>${count}</total></hoc>`;
      case "json":
        return JSON.stringify({ total: count });
      case "text":
        return `Total Hits-of-Code: ${count}`;
      case "int":
        return count;
      default:
        throw new Error('Only "text|xml|json|int" formats are supported now');
    }
  }
}
