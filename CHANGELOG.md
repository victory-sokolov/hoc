# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-01-05

### Added

- **CLI Interface**: Command-line tool for calculating Hits-of-Code metric in Git repositories
- **Git Repository Support**: Automatic detection and analysis of Git repositories
- **Multiple Output Formats**:
  - `int` - Return the total count as an integer (default)
  - `text` - Return human-readable text format
  - `json` - Return JSON formatted output
  - `xml` - Return XML formatted output
- **Author Filtering**: Filter hits by specific author using `-a` or `--author` option
- **Date Range Filtering**:
  - `--since` or `-s` - Set start date (YYYY-MM-DD format, defaults to 2000-01-01)
  - `--before` or `-b` - Set end date (YYYY-MM-DD format, defaults to today)
- **File/Directory Exclusion**: Exclude files and directories using glob patterns
  - Support for multiple exclude patterns via `-e` or `--exclude` option
  - Example: `hoc -e "node_modules/**" -e "vendor/**"`
- **Configuration File Support**: `.hoc` config file for project-specific defaults
  - Store common exclusion patterns
  - Set default output format
  - Configure date ranges and author filters
- **Directory Selection**: Scan specific directories using `-d` or `--dir` option
- **Git Version Validation**: Automatic check for Git version 2.0+ compatibility
- **Smart Git Log Processing**:
  - Ignore whitespace changes (`--ignore-space-change`, `--ignore-all-space`)
  - Find copies harder (`--find-copies-harder`)
  - Track moved files (`-M`)
  - Filter for added, copied, deleted, and modified files (`--diff-filter=ACDM`)
- **TypeScript Implementation**: Full TypeScript support with type definitions
- **Library Export**: Programmatic API with `Base` and `Git` classes
- **Bun Support**: Optimized for Bun runtime
- **Help Documentation**: Comprehensive CLI help via `--help` flag
- **Version Display**: Show version via `-V` or `--version` flag
- **Error Handling**: Graceful error handling with clear error messages
