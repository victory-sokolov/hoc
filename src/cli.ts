import { readFileSync, existsSync } from "fs";
import { Command } from "commander";
import { Base } from "./base.js";

function loadConfigArgs(): string[] {
  if (existsSync(".hoc")) {
    const content = readFileSync(".hoc", "utf-8");
    return content
      .split(/\s+/)
      .map((arg) => arg.trim())
      .filter((arg) => arg.length > 0);
  }
  return [];
}

async function main(): Promise<void> {
  const configArgs = loadConfigArgs();
  const cliArgs = process.argv.slice(2);

  const program = new Command();
  program
    .version("0.1.0")
    .option("-f, --format <format>", "Output format (text|xml|json|int)", "int")
    .option(
      "-e, --exclude <patterns...>",
      'Glob pattern to exclude files/dirs, e.g. "vendor/**"',
    )
    .option("-a, --author <author>", "Filter results by given author", "")
    .option("-d, --dir <dir>", "Directory to scan", ".")
    .option(
      "-s, --since <date>",
      "Set the start date of hoc (YYYY-MM-DD)",
      "2000-01-01",
    )
    .option(
      "-b, --before <date>",
      "Set the end date of hoc (YYYY-MM-DD)",
      new Date().toISOString().split("T")[0],
    )
    .parse([...configArgs, ...cliArgs]);

  const options = program.opts();

  const base = new Base({
    dir: options.dir,
    exclude: options.exclude,
    author: options.author,
    format: options.format,
    since: options.since,
    before: options.before,
  });

  const report = await base.report();
  console.log(report);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
