# Acetate

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![appveyor][appveyor-image]][appveyor-url]
[![david][david-image]][david-url]
[![coverage][coverage-image]][coverage-url]
[![code-climate][code-climate-image]][code-climate-url]

[npm-image]: https://img.shields.io/npm/v/acetate.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/acetate
[travis-image]: https://img.shields.io/travis/patrickarlt/acetate.svg?style=flat-square&label=travis
[travis-url]: https://travis-ci.org/patrickarlt/acetate
[appveyor-image]: https://img.shields.io/appveyor/ci/patrickarlt/acetate.svg?style=flat-square&label=appveyor
[appveyor-url]: https://ci.appveyor.com/project/patrickarlt/acetate
[david-image]: https://img.shields.io/david/patrickarlt/acetate.svg?style=flat-square
[david-url]: https://david-dm.org/patrickarlt/acetate
[coverage-image]: https://img.shields.io/coveralls/patrickarlt/acetate.svg?style=flat-square
[coverage-url]: https://coveralls.io/github/patrickarlt/acetate
[code-climate-image]: https://img.shields.io/codeclimate/github/patrickarlt/acetate.svg?style=flat-square
[code-climate-url]: https://codeclimate.com/github/patrickarlt/acetate

Acetate is a page generating framework for static websites. It is built to be easy to integrate into existing build processes and tools, easy to extend, and developer friendly.

## Usage

Acetate is generally intended to be used with a build system like [Grunt](http://gruntjs.com/), [Gulp](http://gulpjs.com/), or [NPM scripts](http://blog.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/). There are several sample repositories showing how to do this:

* Grunt - *Coming soon*
* Gulp - *Coming soon*
* [Command-line/NPM scripts](https://github.com/patrickarlt/acetate-cli-sample)

## Quickstart

It's also easy to get started with Acetate or integrate Acetate into an existing project:

1. Install the Acetate CLI: `npm install acetate-cli -g`
2. Create a new Node JS project: `npm init`
3. Install Acetate in your project `npm install acetate --save-dev`
4. Create a folder to hold the source of your site and create an `index.md` file. `mkdir src && echo 'Hello Acetate.' > src/index.md`
5. Start the local server: `acetate server --open`

## Contributing

[![semistandard][semistandard-image]][semistandard-url]

Please run `npm test` locally before you submit a PR. This will run the tests and check for [semistandard](https://github.com/Flet/semistandard) style and lint with the [ESLint recommended rules](http://eslint.org/).

More details in the [contributing guide](CONTRIBUTING.md).

[semistandard-image]: https://cdn.rawgit.com/flet/semistandard/master/badge.svg
[semistandard-url]: https://github.com/Flet/semistandard

## License

[MIT](LICENSE)