const test = require("ava");
const path = require("path");
const createPage = require("../lib/createPage.js");
const { createTempFixtures } = require("./util.js");
const { stripIndent } = require("common-tags");

test.beforeEach(createTempFixtures);

const template = stripIndent`
  ---
  foo: bar
  ---

  <h1>Index Page</h1>
`;

const invalidMetadata = stripIndent`
  ---
  foo: bar
  foo: baz
  ---

  <h1>Index Page</h1>
`;

test("should set basic properties", t => {
  const page = createPage("index.html", "index page");

  t.is(page.src, "index.html");
  t.is(page.template, "index page");
  t.is(page.dest, "index.html");
  t.is(page.url, "/");
  t.is(page.relativePath, ".");
});

test("should set `__isMarkdown`", t => {
  const htmlPage = createPage("index.html");
  const markdownPage = createPage("index.md");

  t.true(markdownPage.__isMarkdown);
  t.false(htmlPage.__isMarkdown);
});

test("should set `__templateErrorOffset`", t => {
  const defaultOffset = createPage("index.html", "index page");

  const pageWithOffset = createPage("index.html", "index page", {}, {
    templateErrorOffset: 1
  });

  t.is(defaultOffset.__templateErrorOffset, 0);
  t.is(pageWithOffset.__templateErrorOffset, 1);
});

test("should merge metadata", t => {
  const pageWithMetadata = createPage("index.html", "index page", {
    foo: "bar"
  });

  t.is(pageWithMetadata.foo, "bar");
});

test("should merge in metadata and calculate the proper metadata offset", t => {
  const page = createPage.fromTemplateString("index.html", template);

  t.is(page.foo, "bar");
  t.is(page.template, "<h1>Index Page</h1>");
  t.is(page.__templateErrorOffset, 4);
});

test("should creat a page froma template string with default metadata", t => {
  const page = createPage.fromTemplateString("index.html", template, {
    foo: "bar"
  });

  t.is(page.foo, "bar");
});

test("should throw on invalid metadata", t => {
  const e = t.throws(function () {
    createPage.fromTemplateString("index.html", invalidMetadata);
  });

  t.is(e.name, "MetadataParseError");
  t.is(e.message, `duplicated mapping key at index.html(${e.line}:${e.column})`);
  t.is(typeof e.line, 'number');
  t.is(typeof e.column, 'number');
  t.is(e.file, "index.html");
});

test("should load a page from a template", (t) => {
  const templatepath = path.join(t.context.temp, "create-page", "page.html");

  return createPage.fromTemplate("page.html", templatepath).then((page) => {
    t.is(page.src, "page.html");
    t.is(page.template, "Template");
    t.is(page.foo, "bar");
    t.is(page.__templateErrorOffset, 4);
  });
});

test("should load a page from a template with default metadata", (t) => {
  const templatepath = path.join(t.context.temp, "create-page", "page.html");

  return createPage.fromTemplate("page.html", templatepath, {
    foo: "bar"
  }).then((page) => {
    t.is(page.foo, "bar");
  });
});

test("should prettyify index.html at the root level", (t) => {
  const page = createPage("index.html");

  t.is(page.src, "index.html");
  t.is(page.dest, "index.html");
  t.is(page.url, "/");
  t.is(page.relativePath, ".");
});

test("should prettyify url for page at root of the source folder", (t) => {
  const page = createPage("foo.html");

  t.is(page.src, "foo.html");
  t.is(page.dest, `foo${path.sep}index.html`);
  t.is(page.url, "/foo/");
  t.is(page.relativePath, "..");
});

test("should prettyify urls for pages in nested directories", (t) => {
  const page = createPage("foo/bar.html");

  t.is(page.src, "foo/bar.html");
  t.is(page.dest, path.join('foo', 'bar', 'index.html'));
  t.is(page.url, "/foo/bar/");
  t.is(page.relativePath, "../..");
});

test("should disable pretty urls", (t) => {
  const page = createPage("foo/bar.html", "", {
    prettyUrl: false
  });

  t.is(page.src, "foo/bar.html");
  t.is(page.dest, path.join("foo","bar.html"));
  t.is(page.url, "/foo/bar.html");
  t.is(page.relativePath, "..");
});
