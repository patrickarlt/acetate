const test = require('ava');
const path = require('path');
const fs = require('fs');
const { createTempFixtures } = require('./util.js');
const Acetate = require('../lib/Acetate');
const builder = require('../lib/modes/builder');
const promisify = require('es6-promisify');
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

test.beforeEach(createTempFixtures);

test('should perform a basic build', (t) => {
  const root = path.join(t.context.temp, 'builder');
  const acetate = new Acetate({
    root,
    log: 'silent'
  });

  return builder(acetate).then(pages => {
    return Promise.all([
      readFile(path.join(root, 'build', 'index.html'), 'utf8'),
      readFile(path.join(root, 'build', 'foo', 'markdown', 'index.html'), 'utf8')
    ]);
  }).then((contents) => {
    t.is(contents[0], '<h1>Home Page</h1>');
    t.is(contents[1], '<h1>Markdown</h1>');
    return t.throws(stat(path.join(root, 'build', 'ignored', 'index.html')));
  }).then((error) => {
    t.is(error.code, 'ENOENT');
  });
});

test('should reject if there is an error at any point', (t) => {
  const root = path.join(t.context.temp, 'builder');
  const acetate = new Acetate({
    root,
    config: 'error.config.js',
    log: 'silent'
  });

  return t.throws(builder(acetate)).then(error => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, 'number');
    t.is(typeof error.column, 'number');
  });
});
