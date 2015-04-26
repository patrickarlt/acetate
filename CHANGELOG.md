# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

[Upcoming Changes](https://github.com/patrickarlt/acetate/compare/v0.2.0...master)

## [0.2.0] - 2015-04-25

### Changed
- Large refactor to move to a factory based API and use composition to improve code clarity
- `acetate.args` will no longer include Acetate command line arguments
- The `options`, `args` `src`, `dest`, `root`, and `config` properties are now frozen and cannot be updated.
- Update dependencies

### Added
- Additional CLI doc
- Pages now have more public properties including `metadata` which is a read only copy of the metadata found in the file and `dirty` with will tell you if a page has changed since it was last built.

### Removed
- Remove the `clean` option since it was buggy and did not operate how most people expect.
- 
## [0.1.0] - 2015-04-17

### Added
- tests for error handling
- tests for edge cases in templating
- tests for data loading
- added release automation
- added changelog

### Changed
- **BREAKING** `acetate.src` and `acetate.dest` are removed. Pass them as options or with the `-i` or `-o` flags on the command line
- refactored error handling and logging to be more compact
- refactored page loading to be simpler
- move runner and CLI to event based system

## 0.0.27 - 2015-04-13

### Added
- Unit testing
- Continuous integration

[0.1.0]: https://github.com/patrickarlt/acetate/compare/db93ca4703148fe1a962a8cc3ecca63ba19d08ed...v0.1.0
[0.2.0]: https://github.com/patrickarlt/acetate/compare/v0.1.0...v0.2.0
