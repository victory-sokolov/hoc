[![EO principles respected here](https://www.elegantobjects.org/badge.svg)](https://www.elegantobjects.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bun Version](https://img.shields.io/badge/bun-1.3+-ff69b4.svg)](https://bun.sh//)

It is a command line tool to calculate Hits-of-Code metric
in a source code repository (at the moment we support Git 2+).
You can read more about Hits-of-Code metric in this blog post:
[Hits-of-Code Instead of SLoC](http://www.yegor256.com/2014/11/14/hits-of-code.html).

You can also use [hitsofcode.com](https://hitsofcode.com) by
[Valentin Brandl](https://www.vbrandl.net/), if you want to have a badge
in your repo.

This is a TypeScript port of the original [Ruby implementation](https://github.com/teamed/hoc).

## Installation

```bash
bun install
bun run build
```

## Usage

Run it locally and read its output:

```bash
hoc --help
```

Calculate hits of code for current directory:

```bash
hoc
```

Calculate with specific format:

```bash
hoc -f int
hoc -f text
hoc -f xml
hoc -f json
```

Filter by author:

```bash
hoc -a "author@example.com"
```

Filter by date range:

```bash
hoc -s 2020-01-01 -b 2020-12-31
```

Exclude files/directories (also supported in `.hoc` config file):

```bash
hoc -e "node_modules/**" -e "vendor/**"
```

Note: File exclusion works both via CLI arguments and the `.hoc` configuration file. The `.hoc` file is particularly useful for storing project-specific defaults like common exclusions for `node_modules`, `vendor`, and `dist` directories.

Use custom directory:

```bash
hoc -d /path/to/repo
```

Combine options:

```bash
hoc -f json -a "author@example.com" -e "node_modules/**" -s 2020-01-01
```

## Configuration

Create a `.hoc` file in your repository to configure default options:

```
-f json -e "node_modules/**" -s 2020-01-01
```

CLI arguments will override `.hoc` file settings.

## How to contribute

Read [these guidelines](https://www.yegor256.com/2014/04/15/github-guidelines.html).
Make sure your build is green before you contribute
your pull request. You will need to have [Bun](https://bun.sh/) 1.3+ and
[TypeScript](https://www.typescriptlang.org/) 5.0+ installed. Then:

```bash
bun install
bun run build
bun test
```

If it's clean and you don't see any error messages, submit your pull request.

## Development

```bash
# Install dependencies
bun install

# Build the project
bun run build

# Run all tests
bun test

# Run only unit tests
bun run test:unit

# Run only CLI tests
bun run test:cli

# Run linter
bun run lint

# Run type checking
bun run typecheck
```

## Testing

The project includes comprehensive unit tests covering:

- Git repository parsing and hits calculation
- Multiple output formats (text, json, xml, int)
- Author filtering
- Date range filtering
- File exclusion patterns
- CLI argument parsing
- Configuration file loading
- Edge cases and error handling
