# Contributing

Acetate is open source, and contributions are welcome!

## Installation

1. Fork and clone the repo
2. `cd acetate && npm install`

This will set up everything you need to develop and test Acetate.

## Code Style

Code style and conventions are automatically checked when you run `npm test` with [semistandard](https://www.npmjs.com/package/semistandard).

## Testing

Unit tests are written with [tape](https://www.npmjs.com/package/tape). Coverage is tested with [istanbul](https://gotwarlost.github.io/istanbul/).

Before opening a pull request, make sure you can run `npm test` with no errors. If you add a new feature, you should also write tests for it! Find a bug? Write a failing test!
