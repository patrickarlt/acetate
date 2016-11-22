# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

[Upcoming Changes](https://github.com/patrickarlt/acetate/compare/v0.4.11...master)

## [1.1.1] - 2016-11-22

### Fixed

* Cached patterns for Minimatch in transformers. This should provide a large speed boost during the transform phase.

## [1.1.0] - 2016-10-24

### Added

* The `{% link %}` helper now accepts a new `currentUrl` option for resolving the URL and active state. This allows `{% link %}` to be used in macros where the current page context cannot be accessed.

## [1.0.2] - 2016-8-18

### Fixed

* Switch back to a syncronous loader for Nunjucks that is more reliable.

## [1.0.1] - 2016-6-17

### Fixed

* `acetate.query` now works properly.

## [1.0.0] - 2016-6-17

### Added

* `require` option to the CLI which lets you require tools like `babel-register` before executing Acetate.
* `acetate.prerender(pattern, func)` helper which will run an async function before rendering pages whose `src` matches the supplied pattern.
* `acetate.generate(func)` helper to asyncronously generate pages. `func` gets `pages`, `createPage` and `callback`.
* `acetate.require('path')` helper to require another configuration file. This allows splitting configs up across files and also supports loading files from `node_modules`.
* Dev server will now display errors from Acetate in both the console and as a fullscreen message in the browser.
* Page metadata will appear in the console when using the dev server.

### Changed

* `acetate.transform` has changed it now `acetate.transform(pattern, transformer)` where `pattern` is a glob pattern and `transformer` is a function the gets a `page` and returns a `page`. It show gets a single `page` argument and should return that page after manipulating it. To Asyncronsouly alter pages matching a pattern use `acetate.transformAllAsync` which gets an array of all `pages` and a `callback` which takes `error` and the altered array of pages.
* Pages no longer have a `dirty` flag. This makes rendering stateless and more predictable. However this may break some existing extensions that rely on `dirty`. To preform async actions when the page is "dirty", use `acetate.prerender` which will run before the page renders.
* The `context` in helpers has changed. It is now an object with `page` and `options`. `options` are the [Nunjucks keyword arguments](https://mozilla.github.io/nunjucks/templating.html#keyword-arguments).
* Output from helpers is automatically considered safe and escaped. This makes it easier to return HTML from helpers.
* `acetate.nunjucks` and `acetate.markdown` are now located under the renderer `acetate.renderer.nunjucks`, `acetate.renderer.markdown`
* `acetate.data` no longer accepts a path to a Common JS module. Instead pass a function that will recive a `callback` with a `callback(error, data)` signature.
* Pages no longer can use the `data` key in their metadata to load data onto the page. Instead load all data with the `acetate.data()` helper.
* `acetate.query` has changed it is now `acetate.query(name, filter, map, reduce, inital)` and functions like a map/reduce query over a filtered array of pages.
* Pages can no longer use the `query` key in their metadata to retrive queries. All queries are now global.
* You can now specify layouts, Nunjucks `{% include %}`, `{% extends %}` and `{% import %}` tags with a file extension.
* Acetate no longer loads `**/*.+(html|md)` by default. Add `acetate.load('**/*.+(md|html)')` to the top of your config file.

### Removed

* `acetate.use`. Replace with `acetate.transformAllAsync`. You can no longer manipulate the state of the `acetate` object, only the pages.
* `acetate.output`. Replaced with `acetate.generate`.

### Fixed

* Filters added with `acetate.filter` can now accept arguments.
* Lots of strange behavior with the dev server, watcher and reloading configuration files.

### Misc.

* Tests have been rewritten with [AVA](https://github.com/avajs/ava)
* Linting is now done by [ESLint](http://eslint.org/) with the [ESLint recommended rules](http://eslint.org/docs/rules/) and [Semistandard](https://github.com/Flet/semistandard)

## [0.4.11] - 2016-05-21

### Fixed

* Queries are re-run whenever they are accessed to ensure the latest page data.

## [0.4.10] - 2016-04-28

### Fixed

* Proper MIME types for Markdown documents.

## [0.4.9] - 2016-04-22

### Added

* Added `https-cert` and `https-key` as CLI options to allow for custom SSL certificates while developing.

## [0.4.8] - 2016-04-18

### Changed

* `info` log level is now less verbose
* Server now re-renders pages on every request, not just when the source file changes.

### Changed

## [0.4.7] - 2016-01-14

### Fixed

* Restore unintentional change to metadata merging.

## [0.4.6] - 2016-01-14

### Fixed

* Restore unintentional change to metadata merging.

## [0.4.5] - 2016-01-014

### Fixed

* Pages created with `acetate.output` are no longer added multiple times.

## [0.4.4] - 2016-01-013

### Fixed

* Infinite loop where server rebuild files and then reloads.

## [0.4.3] - 2016-01-013

### Fixed

* Fixed memory leak when watching data files.

## [0.4.2] - 2016-01-07

### Changed

* Pages are now always rebuilt every time they are requested when in server mode.
* Server startup is now much faster, as all pages are considered "clean" when the server starts and are rebuilt when requested.
* Small tweaks to logging and log output.

### Fixed

* Fixed memory leak when watching data files.
* Pages created with `acetate.output` are no longer added multiple times.

## [0.4.1] - 2016-01-05

### Added

* Extension names are now logged next to their run time.

### Fixed

* Extensions that are run inside extensions now run and execute after the extension that invoked them has finished.


## [0.4.0] - 2016-01-04

### Added

* `https` option that corresponds to the [https option in BrowserSync](https://www.browsersync.io/docs/options/#option-https).
* `--https` flag for enabling https support in the CLI.
* `acetate.output` helper for creating dynamically generated pages.
* If `mode` is `build` (the default) the `acetate` method now accepts a callback that is passed `errors`, `warnings` and `status` that will run after the site is built for better integration with Gulp [#57](https://github.com/patrickarlt/acetate/issues/57).
* `{% debug %}` helper that can print a specific variable like `{% debug 'someVar' %}` or complete page metadata `{% debug %}`

### Changed

* Console output from BrowserSync now has the `[Acetate]` prefix.
* Tests now use [node-tap] (https://github.com/isaacs/node-tap)
* Switch to [Coveralls.io](https://coveralls.io/github/patrickarlt/acetate) for code coverage reporting.
* `acetate.helper` can now create helpers without arguments.

### Fixed

* Travis CI and AppVeyor now both pass against Node 0.12, 4, and 5.

## [0.3.1] - 2015-06-30

### Fixed

* Built-in server now properly supports URLs without trailing slashes.

## [0.3.0] - 2015-06-21

### Changed

* Built-in server is now based on [BrowserSync](http://browsersync.io) and has built in live reload support.
* Built in server no longer needs to wait for the entire site to be built. It now builds and serves pages as requested.
* `server` and `watcher` options are deprecated. Now pass the `mode` option with a value of `'server'` `'watch'` or `'build'`.
* `findPort` option is deprecated. A port is always found by default now.

### Fixed

* Watching for changes to the configuration file should now work as expected.
* Tests now pass on Windows and are run with the AppVeyor CI.

### Removed

* Support for 404 pages. This was a feature that was lost with the move to BrowserSync. It may be added back in the future.

## [0.2.2] - 2015-05-13

### Fixed

* Fixed a bug where `{{relativePath}}` would not produce the correct path in some cases.

## [0.2.1] - 2015-05-01

### Added
* Lots of new tests. Test coverage should now be fairly high with only a few remaining edge cases
* New `watcher:ready` event when the watcher starts watching files
* New `watcher:start` event when the watcher starts
* New `watcher:stop` event when the watcher stops
* New `page:build` method for listening to when and individual page finished building
* New `page:clean` method for when a pages built output is deleted

### Changed
* Improvements to `travis.yml`, readme and contributing guide.
* Updated dependencies
* Simplified framework for running tests and gathering coverage information
* `page.clean()` will no longer clear the directory if it is empty
* Previously `acetate.query(name, glob, builder)` and `acetate.transform(glob, transformer)` only accepted globs like `'**/*'` to filter there input. They can now accept functions like `function (page) { return page.transformMe; }` or simple objects `{ transformMe: true }` to filter pages before running the query or transform

### Fixed
* It is not possible to run Acetate without a configuration file. Previously this worked but reported an error.
* Edge cases with building pretty URLs for non HTML files have been fixed
* Sever will now properly use a `404.html` page if it is present in your `src` folder.
* The `url` property on the root page is now properly `/`

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
- tests for edge cases in templates
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
[0.2.1]: https://github.com/patrickarlt/acetate/compare/v0.2.0...v0.2.1
[0.2.2]: https://github.com/patrickarlt/acetate/compare/v0.2.1...v0.2.2
[0.3.0]: https://github.com/patrickarlt/acetate/compare/v0.2.2...v0.3.0
[0.3.1]: https://github.com/patrickarlt/acetate/compare/v0.3.0...v0.3.1
[0.4.0]: https://github.com/patrickarlt/acetate/compare/v0.3.1...v0.4.0
[0.4.1]: https://github.com/patrickarlt/acetate/compare/v0.4.0...v0.4.1
[0.4.2]: https://github.com/patrickarlt/acetate/compare/v0.4.1...v0.4.2
[0.4.3]: https://github.com/patrickarlt/acetate/compare/v0.4.2...v0.4.3
[0.4.4]: https://github.com/patrickarlt/acetate/compare/v0.4.3...v0.4.4
[0.4.5]: https://github.com/patrickarlt/acetate/compare/v0.4.4...v0.4.5
[0.4.6]: https://github.com/patrickarlt/acetate/compare/v0.4.5...v0.4.6
[0.4.7]: https://github.com/patrickarlt/acetate/compare/v0.4.6...v0.4.7
[0.4.8]: https://github.com/patrickarlt/acetate/compare/v0.4.7...v0.4.8
