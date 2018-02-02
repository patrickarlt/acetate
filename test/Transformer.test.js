const test = require("ava");
const path = require("path");
const Acetate = require("../lib/Acetate.js");
const createPage = require("../lib/createPage.js");
const { createTempFixtures } = require("./util.js");
const sinon = require("sinon");

test.beforeEach(createTempFixtures);

test("perform a basic sync transformation", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.transform("**/*", function (page) {
    page.foo = "foo";
    return page;
  });

  const page = createPage("index.html");

  return acetate.transformPage(page).then(pages => {
    t.is(pages.foo, "foo");
  });
});

test("should pass on a basic transformation that does not match", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  const spy = sinon.spy();

  acetate.transform("no/match", spy);

  const page = createPage("index.html");

  return acetate.transformPage(page).then(pages => {
    t.is(spy.callCount, 0);
  });
});

test("reject with an error from a sync transformation", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.transform("**/*", function () {
    throw new Error("D'oh");
  });

  const page = createPage("index.html");

  return t.throws(acetate.transformPage(page)).then(error => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, "number");
    t.is(typeof error.column, "number");
    t.truthy(error.file);
  });
});

test("perform a basic async transformation", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.transform("**/*", function (page, callback) {
    page.foo = "foo";
    callback(null, page);
  });

  const page = createPage("index.html");

  return acetate.transformPage(page).then(pages => {
    t.is(pages.foo, "foo");
  });
});

test("should pass on an async transformation that does not match", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  const spy = sinon.spy();

  acetate.transform("no/match", spy);

  const page = createPage("index.html");

  return acetate.transformPage(page).then(pages => {
    t.is(spy.callCount, 0);
  });
});

test("reject with an error from a async transformation", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.transform("**/*", function (page, callback) {
    callback("D'oh");
  });

  const page = createPage("index.html");

  return t.throws(acetate.transformPage(page)).then(error => {
    t.regex(error.message, /D'oh/);
    t.is(error.name, "TransformerError");
    t.is(typeof error.line, "number");
    t.is(typeof error.column, "number");
  });
});

test("reject with an error thown inside an async transformation", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.transform("**/*", function (page, callback) {
    throw new Error("D'oh");
  });

  const page = createPage("index.html");

  return t.throws(acetate.transformPage(page)).then(error => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, "number");
    t.is(typeof error.column, "number");
    t.truthy(error.file);
  });
});

test.skip("should query an array of all pages by default", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
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

  acetate.query("pages", "**/*", map, reduce, []);
  const page = createPage("page1.html");
  acetate._pagesLoaded = true;
  acetate._pages = [
    page,
    createPage("page2.html"),
    createPage("page3.html")
  ];

  return acetate.transformPage(page).then((page) => {
    t.is(page.queries.pages.length, 3);
    t.is(page.queries.pages[0], "page1.html");
    t.is(page.queries.pages[1], "page2.html");
    t.is(page.queries.pages[2], "page3.html");
  });
});

test.skip("apply JSON data to a page", t => {
  const acetate = new Acetate({
    sourceDir: path.join(t.context.temp, "transformer-json-data"),
    log: "silent",
    config: false
  });

  acetate.data("json", "data.json");

  const page = createPage("index.html");

  return acetate.transformPage(page).then((pages) => {
    t.is(pages.data.json.foo, "bar");
  });
});

test.skip("apply YAML data to a page", t => {
  const acetate = new Acetate({
    sourceDir: path.join(t.context.temp, "transformer-yaml-data"),
    log: "silent",
    config: false
  });

  acetate.data("yaml", "data.yaml");

  const page = createPage("index.html");

  acetate.transformPage(page).then((page) => {
    t.is(page.data.yaml.foo, "bar");
  });
});

test.skip("apply data from a function to a page", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.data("async", function (done) {
    process.nextTick(function () {
      done(null, {
        foo: "bar"
      });
    });
  });

  const page = createPage("index.html");

  return acetate.transformPage(page).then((page) => {
    t.is(page.data.async.foo, "bar");
  });
});

test.skip("reject when a data function throws an error", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.data("async", function (done) {
    process.nextTick(function () {
      done(new Error("D'oh"));
    });
  });

  const page = createPage("index.html");

  return t.throws(acetate.transformPage(page)).then((error) => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, "number");
    t.is(typeof error.column, "number");
    t.truthy(error.file);
  });
});

test("ignore a page", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.ignore("index.html");

  const page = createPage("index.html");

  return acetate.transformPage(page).then((pages) => {
    t.true(pages.ignore);
  });
});

test("merge metadata", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.metadata("index.html", {
    foo: "bar"
  });

  const page = createPage("index.html");

  return acetate.transformPage(page).then((page) => {
    t.is(page.foo, "bar");
  });
});

test("deep merge metadata", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.metadata("index.html", {
    foo: {
      foo: "foo",
      bar: "foo",
      simpleArray: [1, 2, 3],
      objectArray: [{
        foo: "foo"
      }]
    }
  });

  acetate.metadata("index.html", {
    foo: {
      bar: "bar",
      baz: "baz",
      simpleArray: [4, 5, 6],
      objectArray: [{
        bar: "bar"
      }]
    }
  });

  const page = createPage("index.html");

  return acetate.transformPage(page).then((page) => {
    t.is(page.foo.foo, "foo");
    t.is(page.foo.bar, "bar");
    t.is(page.foo.baz, "baz");
    t.deepEqual(page.foo.simpleArray, [4, 5, 6]);
    t.deepEqual(page.foo.objectArray, [{
      bar: "bar"
    }]);
  });
});

test("merge metadata should not overwrite local metadata", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.metadata("index.html", {
    foo: "bar"
  });

  const page = createPage("index.html", "", {
    foo: "baz"
  });

  return acetate.transformPage(page).then((page) => {
    t.is(page.foo, "baz");
  });
});

test("update layout", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  acetate.layout("index.html", "_layout.html:main");

  const page = createPage("index.html");

  return acetate.transformPage(page).then((page) => {
    t.is(page.layout, "_layout.html:main");
  });
});

test.skip("should generate new pages while transforming", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  const page = createPage("index.html");

  acetate.generate((page, createPage, done) => {
    t.is(page, page);

    process.nextTick(function () {
      done(null, [createPage("generated.html")]);
    });
  });

  return acetate.transformPage([page]).then((pages) => {
    t.is(pages.length, 2);
    t.is(pages[0].src, "index.html");
    t.is(pages[1].src, "generated.html");
  });
});

test.skip("should reject when generator throws an error", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  const page = createPage("index.html");

  acetate.generate((pages, createPage, done) => {
    throw new Error("D'oh");
  });

  return t.throws(acetate.transformPage([page])).then((error) => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, "number");
    t.is(typeof error.column, "number");
    t.truthy(error.file);
  });
});

test.skip("should reject when generator calls back with an error", t => {
  const acetate = new Acetate({
    log: "silent",
    config: false
  });

  const page = createPage("index.html");

  acetate.generate((pages, createPage, done) => {
    process.nextTick(function () {
      done(new Error("D'oh"));
    });
  });

  return t.throws(acetate.transformPage([page])).then((error) => {
    t.regex(error.toString(), /Error D'oh at/);
    t.is(typeof error.line, "number");
    t.is(typeof error.column, "number");
    t.truthy(error.file);
  });
});
