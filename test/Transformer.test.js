const test = require('ava');
const path = require('path');
const Transformer = require('../lib/Transformer');
const createPage = require('../lib/createPage.js');
const { createTempFixtures } = require('./util.js');
const sinon = require('sinon');

test.beforeEach(createTempFixtures);

test('perform a basic sync transformation', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.transform('**/*', function (page) {
    page.foo = 'foo';
    return page;
  });

  const page = createPage('index.html');

  return transformer.transformPages([page]).then(pages => {
    t.is(pages[0].foo, 'foo');
  });
});

test('should pass on a basic transformation that does not match', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  const spy = sinon.spy();

  transformer.transform('no/match', spy);

  const page = createPage('index.html');

  return transformer.transformPages([page]).then(pages => {
    t.is(spy.callCount, 0);
  });
});

test('reject with an error from a sync transformation', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.transform('**/*', function () {
    throw new Error('D\'oh');
  });

  const page = createPage('index.html');

  return t.throws(transformer.transformPages([page])).then(error => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, 'number');
    t.is(typeof error.column, 'number');
    t.truthy(error.file);
  });
});

test('perform a basic async transformation', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.transformAsync('**/*', function (page, callback) {
    page.foo = 'foo';
    callback(null, page);
  });

  const page = createPage('index.html');

  return transformer.transformPages([page]).then(pages => {
    t.is(pages[0].foo, 'foo');
  });
});

test('should pass on an async transformation that does not match', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  const spy = sinon.spy();

  transformer.transformAsync('no/match', spy);

  const page = createPage('index.html');

  return transformer.transformPages([page]).then(pages => {
    t.is(spy.callCount, 0);
  });
});

test('reject with an error from a async transformation', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.transformAsync('**/*', function (page, callback) {
    callback('D\'oh');
  });

  const page = createPage('index.html');

  return t.throws(transformer.transformPages([page])).then(error => {
    t.regex(error.message, /D'oh/);
    t.is(error.name, 'TransformerError');
    t.is(typeof error.line, 'number');
    t.is(typeof error.column, 'number');
  });
});

test('reject with an error thown inside an async transformation', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.transformAsync('**/*', function (page, callback) {
    throw new Error('D\'oh');
  });

  const page = createPage('index.html');

  return t.throws(transformer.transformPages([page])).then(error => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, 'number');
    t.is(typeof error.column, 'number');
    t.truthy(error.file);
  });
});

test('should transform all pages', (t) => {
  const page1 = createPage('index.html');
  const page2 = createPage('about.html');
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.transformAll(function (pages) {
    pages.forEach((page) => {
      page.foo = 'bar';
    });

    return pages;
  });

  return transformer.transformPages([page1, page2]).then((pages) => {
    t.is(pages[0].foo, 'bar');
    t.is(pages[1].foo, 'bar');
  });
});

test('reject with an error from a sync transformation on all pages', t => {
  const page1 = createPage('index.html');
  const page2 = createPage('about.html');
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.transformAll(function (pages) {
    pages.forEach(() => {
      throw 'D\'oh'; // eslint-disable-line no-throw-literal
    });

    return pages;
  });

  return t.throws(transformer.transformPages([page1, page2])).then((error) => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, 'number');
    t.is(typeof error.column, 'number');
    t.truthy(error.file);
  });
});

test('should transform all pages async', (t) => {
  const page1 = createPage('index.html');
  const page2 = createPage('about.html');
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.transformAllAsync(function (pages, done) {
    pages.forEach((page) => {
      page.foo = 'bar';
    });

    process.nextTick(function () {
      done(null, pages);
    });
  });

  return transformer.transformPages([page1, page2]).then((pages) => {
    t.is(pages[0].foo, 'bar');
    t.is(pages[1].foo, 'bar');
  });
});

test('reject with an error from a async transformation on all pages', t => {
  const page1 = createPage('index.html');
  const page2 = createPage('about.html');
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.transformAllAsync(function (pages, done) {
    process.nextTick(function () {
      done('D\'oh');
    });
  });

  return t.throws(transformer.transformPages([page1, page2])).then((error) => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, 'number');
    t.is(typeof error.column, 'number');
    t.truthy(error.file);
  });
});

test('reject with an error thrown from an async transformation on all pages', t => {
  const page1 = createPage('index.html');
  const page2 = createPage('about.html');
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.transformAllAsync(function (pages, done) {
    throw new Error('D\'oh');
  });

  return t.throws(transformer.transformPages([page1, page2])).then((error) => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, 'number');
    t.is(typeof error.column, 'number');
    t.truthy(error.file);
  });
});

test('should query an array of all pages by default', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  function map (page) {
    return {
      src: page.src
    };
  }

  function reduce (value, page) {
    value.push(page.src);
    return value;
  }

  transformer.query('pages', '**/*', map, reduce, []);

  const page1 = createPage('page1.html');
  const page2 = createPage('page2.html');
  const page3 = createPage('page3.html');

  return transformer.transformPages([page1, page2, page3]).then((pages) => {
    t.is(pages[0].queries.pages.length, 3);
    t.is(pages[0].queries.pages[0], 'page1.html');
    t.is(pages[0].queries.pages[1], 'page2.html');
    t.is(pages[0].queries.pages[2], 'page3.html');
  });
});

test('apply JSON data to a page', t => {
  const transformer = new Transformer({
    sourceDir: path.join(t.context.temp, 'transformer-json-data'),
    log: 'silent'
  });

  transformer.data('json', 'data.json');

  const page = createPage('index.html');

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].data.json.foo, 'bar');
  });
});

test('apply YAML data to a page', t => {
  const transformer = new Transformer({
    sourceDir: path.join(t.context.temp, 'transformer-yaml-data'),
    log: 'silent'
  });

  transformer.data('yaml', 'data.yaml');

  const page = createPage('index.html');

  transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].data.yaml.foo, 'bar');
  });
});

test('apply data from a function to a page', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.data('async', function (done) {
    process.nextTick(function () {
      done(null, {
        foo: 'bar'
      });
    });
  });

  const page = createPage('index.html');

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].data.async.foo, 'bar');
  });
});

test('reject when a data function throws an error', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.data('async', function (done) {
    process.nextTick(function () {
      done(new Error('D\'oh'));
    });
  });

  const page = createPage('index.html');

  return t.throws(transformer.transformPages([page])).then((error) => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, 'number');
    t.is(typeof error.column, 'number');
    t.truthy(error.file);
  });
});

test('ignore a page', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.ignore('index.html');

  const page = createPage('index.html');

  return transformer.transformPages([page]).then((pages) => {
    t.true(pages[0].ignore);
  });
});

test('merge metadata', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.metadata('index.html', {
    foo: 'bar'
  });

  const page = createPage('index.html');

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].foo, 'bar');
  });
});

test('merge metadata should not overwrite local metadata', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.metadata('index.html', {
    foo: 'bar'
  });

  const page = createPage('index.html', '', {
    foo: 'baz'
  });

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].foo, 'baz');
  });
});

test('update layout', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  transformer.layout('index.html', '_layout.html:main');

  const page = createPage('index.html');

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages[0].layout, '_layout.html:main');
  });
});

test('should generate new pages while transforming', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  const page = createPage('index.html');

  transformer.generate((pages, createPage, done) => {
    t.is(pages[0], page);

    process.nextTick(function () {
      done(null, [createPage('generated.html')]);
    });
  });

  return transformer.transformPages([page]).then((pages) => {
    t.is(pages.length, 2);
    t.is(pages[0].src, 'index.html');
    t.is(pages[1].src, 'generated.html');
  });
});

test('should reject when generator throws an error', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  const page = createPage('index.html');

  transformer.generate((pages, createPage, done) => {
    throw new Error('D\'oh');
  });

  return t.throws(transformer.transformPages([page])).then((error) => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, 'number');
    t.is(typeof error.column, 'number');
    t.truthy(error.file);
  });
});

test('should reject when generator calls back with an error', t => {
  const transformer = new Transformer({
    log: 'silent'
  });

  const page = createPage('index.html');

  transformer.generate((pages, createPage, done) => {
    process.nextTick(function () {
      done(new Error('D\'oh'));
    });
  });

  return t.throws(transformer.transformPages([page])).then((error) => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, 'number');
    t.is(typeof error.column, 'number');
    t.truthy(error.file);
  });
});
