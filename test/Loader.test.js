const test = require("ava");
const fs = require("fs");
const path = require("path");
const Acetate = require("../lib/Acetate.js");
const { createTempFixtures } = require("./util.js");
const { stripIndent } = require("common-tags");

test.beforeEach(createTempFixtures);

test("load pages with a glob", t => {
  const acetate = new Acetate({
    config: false,
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent"
  });

  acetate.load("**/*.+(md|html)");

  return acetate.getPages().then(pages => {
    t.is(pages[0].src, "index.html");
  });
});

test("load pages with a glob and default metadata", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)", {
    metadata: {
      foo: "bar"
    }
  });

  return acetate.getPages().then(pages => {
    t.is(pages[0].foo, "bar");
  });
});

test("should throw if there is an error loading any page", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-error",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)");

  return t.throws(acetate.getPages()).then(e => {
    t.is(e.name, "MetadataParseError");
    t.is(e.message, "duplicated mapping key at index.html(2:0)");
    t.is(e.line, 2);
    t.is(e.column, 0);
    t.is(e.file, "index.html");
  });
});

test.cb("the watcher should add pages when they are created", t => {
  const sourceDir = path.join(t.context.temp, "loader-basic");
  const addition = path.join(sourceDir, "addition.html");

  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)");

  acetate.getPages().then(function () {
    acetate.once("watcher:add", (page) => {
      acetate.stopWatcher();

      t.is(page.src, "addition.html");
      t.is(page.template, "File Added");

      acetate.getPages().then(pages => {
        t.is(pages.length, 2);
        t.end();
      }).catch((error) => {
        t.fail(error);
        t.end();
      });
    });

    acetate.once("watcher:ready", () => {
      fs.writeFile(addition, "File Added", function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    acetate.startWatcher();
  });
});

test.cb("the watcher should use default metadata when pages are created", t => {
  const sourceDir = path.join(t.context.temp, "loader-basic");
  const addition = path.join(sourceDir, "addition.html");

  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)", {
    metadata: {
      foo: "bar"
    }
  });

  acetate.getPages().then(function () {
    acetate.once("watcher:add", (page) => {
      acetate.stopWatcher();
      t.is(page.foo, "bar");

      acetate.getPages().then(pages => {
        t.is(pages.length, 2);
        t.is(pages[1].foo, "bar");
        t.end();
      }).catch((error) => {
        t.fail(error);
        t.end();
      });
    });

    acetate.once("watcher:ready", () => {
      fs.writeFile(addition, "File Added", function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    acetate.startWatcher();
  });
});

test.cb("the watcher should update pages when they are changed", t => {
  const sourceDir = path.join(t.context.temp, "loader-basic");
  const change = path.join(sourceDir, "index.html");

  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)");

  acetate.getPages().then(function () {
    acetate.once("watcher:change", (page) => {
      acetate.stopWatcher();
      t.is(page.src, "index.html");
      t.is(page.template, "<h1>Index Changed</h1>");
      acetate.getPages().then(pages => {
        t.is(pages.length, 1);
        t.end();
      }).catch((error) => {
        t.fail(error);
        t.end();
      });
    });

    acetate.once("watcher:ready", () => {
      fs.writeFile(change, "<h1>Index Changed</h1>", function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    acetate.startWatcher();
  });
});

test.cb("the watcher should preserve default metadata when pages are changed", t => {
  const sourceDir = path.join(t.context.temp, "loader-basic");
  const change = path.join(sourceDir, "index.html");

  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)", {
    metadata: {
      foo: "bar"
    }
  });

  acetate.getPages().then(function () {
    acetate.once("watcher:change", (page) => {
      acetate.stopWatcher();

      t.is(page.foo, "bar");

      acetate.getPages().then(pages => {
        t.is(page.foo, "bar");
        t.end();
      }).catch((error) => {
        t.fail(error);
        t.end();
      });
    });

    acetate.once("watcher:ready", () => {
      fs.writeFile(change, "<h1>Index Changed</h1>", function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    acetate.startWatcher();
  });
});

test.cb("the watcher should remove pages when they are deleted", t => {
  const sourceDir = path.join(t.context.temp, "loader-basic");
  const remove = path.join(sourceDir, "index.html");

  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)");

  acetate.getPages().then(function () {
    acetate.once("watcher:ready", () => {
      fs.unlink(remove, function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    acetate.once("watcher:delete", (page) => {
      acetate.stopWatcher();
      t.is(page.src, "index.html");
      t.is(page.template, "<h1>index.html</h1>");
      acetate.getPages().then(pages => {
        t.is(pages.length, 0);
        t.end();
      }).catch((error) => {
        t.fail(error);
        t.end();
      });
    });

    acetate.startWatcher();
  });
});

test.cb("the watcher should emit an error if there is an error loading pages", t => {
  const sourceDir = path.join(t.context.temp, "loader-basic");
  const change = path.join(sourceDir, "index.html");

  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)");

  const template = stripIndent`
    ---
    foo: bar
    foo: baz
    ---

    '<h1>Index Changed</h1>'
  `;

  acetate.getPages().then(function () {
    acetate.once("watcher:error", (e) => {
      acetate.stopWatcher();
      t.is(e.error.name, "MetadataParseError");
      t.is(e.error.message, "duplicated mapping key at index.html(2:0)");
      t.is(e.error.line, 2);
      t.is(e.error.column, 0);
      t.is(e.error.file, "index.html");
      t.end();
    });

    acetate.once("watcher:ready", () => {
      fs.writeFile(change, template, function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    acetate.startWatcher();
  });
});

test.cb("should emit an add event when a potential template is added", t => {
  const sourceDir = path.join(t.context.temp, "loader-basic");
  const addition = path.join(sourceDir, "_addition.html");

  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)");

  acetate.getPages().then(function () {
    acetate.once("watcher:template:add", (page) => {
      acetate.stopWatcher();
      t.end();
    });

    acetate.once("watcher:ready", () => {
      fs.writeFile(addition, "File Added", function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    acetate.startWatcher();
  });
});

test.cb("should emit a change event when a potential template is edited", t => {
  const sourceDir = path.join(t.context.temp, "loader-basic");
  const change = path.join(sourceDir, "_not-loaded.html");

  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)");

  acetate.getPages().then(function () {
    acetate.once("watcher:template:change", (page) => {
      acetate.stopWatcher();
      t.end();
    });

    acetate.once("watcher:ready", () => {
      fs.writeFile(change, "File Changed", function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    acetate.startWatcher();
  });
});

test.cb("should emit a delete event when a potential template is edited", t => {
  const sourceDir = path.join(t.context.temp, "loader-basic");
  const remove = path.join(sourceDir, "_not-loaded.html");

  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "loader-basic",
    log: "silent",
    config: false
  });

  acetate.load("**/*.+(md|html)");

  acetate.getPages().then(function () {
    acetate.once("watcher:template:delete", (page) => {
      acetate.stopWatcher();
      t.end();
    });

    acetate.once("watcher:ready", () => {
      fs.unlink(remove, function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    acetate.startWatcher();
  });
});
