const test = require("ava");
const fs = require("fs");
const path = require("path");
const Acetate = require("../lib/Acetate.js");
const { createTempFixtures } = require("./util.js");
const { stripIndent } = require("common-tags");
const createPage = require("../lib/createPage");

test.beforeEach(createTempFixtures);

test("load a basic config file", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    log: "silent"
  });

  return acetate.getPages().then(pages => {
    t.is(pages[0].src, "foo/markdown.md");
    t.is(pages[1].src, "index.html");
  });
});

test("should seperate the configuration over multiple files", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    config: "with-require.config.js",
    log: "silent"
  });

  return acetate.getPages().then(pages => {
    t.is(pages[0].src, "foo/markdown.md");
    t.is(pages[1].src, "index.html");
  });
});

test("should impliment a plugin interface", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    config: "blank.config.js",
    log: "silent"
  });

  acetate.use(function(a) {
    a.load("**/*.+(md|html)");
  });

  return acetate.getPages().then(pages => {
    t.is(pages[0].src, "foo/markdown.md");
    t.is(pages[1].src, "index.html");
  });
});

test.cb(
  "should watch config file for changes and reload the configuration",
  t => {
    const root = path.join(t.context.temp, "acetate-configs");
    const configPath = path.join(root, "acetate.config.js");
    const acetate = new Acetate({
      root,
      log: "silent"
    });

    const newConfig = stripIndent`
    module.exports = function (acetate) {
      acetate.load('**/*.html');
    }
  `;

    acetate.once("config:watcher:ready", function() {
      acetate.once("config:loaded", function() {
        acetate.stopWatcher();

        acetate.getPages().then(function(pages) {
          t.is(pages.length, 1);
          t.end();
        });
      });

      fs.writeFile(configPath, newConfig, function(error) {
        if (error) {
          t.fail(`Could not write new config file to ${configPath}`);
        }
      });
    });

    acetate.startWatcher();
  }
);

test("should throw if an invalid config is loaded", t => {
  t.throws(function() {
    // eslint-disable-next-line no-new
    new Acetate({
      root: path.join(t.context.temp, "acetate-configs"),
      config: "with-error.config.js",
      log: "silent"
    });
  });
});

test.cb(
  "should emit an error if the config throws an error while the watcher is running",
  t => {
    const root = path.join(t.context.temp, "acetate-configs");
    const configPath = path.join(root, "acetate.config.js");
    const acetate = new Acetate({
      root,
      log: "silent"
    });

    const newConfig = stripIndent`
    module.exports = function (acetate) {
      acetate.load('**/*.html);
    }
  `;

    acetate.once("config:watcher:ready", function() {
      acetate.once("config:error", function(e) {
        acetate.stopWatcher();

        t.is(e.error.name, "AcetateConfigError");
        t.end();
      });

      fs.writeFile(configPath, newConfig, function(error) {
        if (error) {
          t.fail(`Could not write new config file to ${configPath}`);
        }
      });
    });

    acetate.startWatcher();
  }
);

test.cb(
  "should emit an error if the config throws an error while the watcher is running",
  t => {
    const root = path.join(t.context.temp, "acetate-configs");
    const configPath = path.join(root, "acetate.config.js");
    const acetate = new Acetate({
      root,
      log: "silent"
    });

    const newConfig = stripIndent`
    module.exports = function (acetate) {
      acetate.load(foo);
    }
  `;

    acetate.once("config:watcher:ready", function() {
      acetate.once("config:error", function(e) {
        t.is(e.error.name, "AcetateConfigError");
        t.end();
      });

      fs.writeFile(configPath, newConfig, function(error) {
        if (error) {
          t.fail(`Could not write new config file to ${configPath}`);
        }
      });
    });

    acetate.startWatcher();
  }
);

test("should render markdown with a built in helper", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    log: "silent"
  });

  const page = createPage(
    "index.html",
    stripIndent`
    {% markdown %}
      # Markdown
    {% endmarkdown %}
  `
  );

  return acetate.renderPage(page).then(output => {
    t.is(output, "<h1>Markdown</h1>");
  });
});

test("should render markdown included from another file with a built in helper", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    log: "silent"
  });

  const page = createPage(
    "index.html",
    stripIndent`
    {% markdown %}
      {% include '_markdown_partial.md'%}
    {% endmarkdown %}
  `
  );

  return acetate.renderPage(page).then(output => {
    t.is(output, "<h1>Markdown</h1>");
  });
});

test("should highlight code with a built in helper", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    log: "silent"
  });

  const page = createPage(
    "index.html",
    stripIndent`
    {% highlight %}
    var foo = bar;
    {% endhighlight %}

    {% highlight 'js' %}
    var foo = bar;
    {% endhighlight %}

    {% highlight 'text' %}
    foo
    {% endhighlight %}

    {% highlight 'plain' %}
    foo
    {% endhighlight %}
  `
  );

  const expected = stripIndent`
    <pre><code class="ebnf"><span class="hljs-attribute">var foo</span> = bar;</code></pre>

    <pre><code class="js"><span class="hljs-keyword">var</span> foo = bar;</code></pre>

    <pre><code class="text">foo</code></pre>

    <pre><code class="plain">foo</code></pre>
  `;

  return acetate.renderPage(page).then(output => {
    t.is(output, expected);
  });
});

test("should highlight code with a built in helper and custom highlighter", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    log: "silent"
  });

  acetate.highlight = {
    highlight: (lang, body) => {
      return {
        language: "foo",
        value: "bar"
      };
    },
    highlightAuto: body => {
      return {
        language: "foo",
        value: "bar"
      };
    }
  };

  const page = createPage(
    "index.html",
    stripIndent`
    {% highlight %}
    var foo = bar;
    {% endhighlight %}
  `
  );

  const expected = stripIndent`
    <pre><code class="foo">bar</code></pre>
  `;

  return acetate.renderPage(page).then(output => {
    t.is(output, expected);
  });
});

test("should create anchors code with a built in helper", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    log: "silent"
  });

  const template = stripIndent`
    {% link '/', 'Home' %}
    {% link '/', 'Home', 'data-foo'='Foo', 'data-bar'='Bar' %}
    {% link '/', 'Home', id="logo", class="nav-link" %}
    {% link '../', 'Back' %}
    {% link '../', 'Back', class="back-link" %}
    {% link '../', 'Back', class="back-link", activeClass="active" %}
    {% link '/nested/', 'Back', requireExactMatch=true %}
    {% link '/nested/page/', 'Page' %}
    {% link 'http://example.com', 'Example', class="external-link" %}
    {% link '//example.com', 'Example' %}
    {% link '/about/#team', 'Team' %}
    {% link '/nested/page/#team', 'Team' %}
    {% link '/nested/page#team', 'Team' %}
    {% link '#team', 'Team' %}
    {% link '/', 'Home', currentUrl='/' %}
    {% link '/', 'Home', currentUrl='/nested/' %}
    {% link '/nested/', 'Page', currentUrl='/' %}
    {% link '/nested/', 'Page', currentUrl='/nested/' %}
    {% link relativePath + '/nested/page/', 'Link With relativePath' %}
    `;

  const page = createPage("nested/page/index.html", template);

  const expected = stripIndent`
    <a href="/">Home</a>
    <a href="/" data-foo="Foo" data-bar="Bar">Home</a>
    <a href="/" id="logo" class="nav-link">Home</a>
    <a href="../" class="is-active">Back</a>
    <a href="../" class="is-active back-link">Back</a>
    <a href="../" class="active back-link">Back</a>
    <a href="/nested/">Back</a>
    <a href="/nested/page/" class="is-active">Page</a>
    <a href="http://example.com" class="external-link">Example</a>
    <a href="//example.com">Example</a>
    <a href="/about/#team">Team</a>
    <a href="/nested/page/#team" class="is-active">Team</a>
    <a href="/nested/page/#team" class="is-active">Team</a>
    <a href="#team" class="is-active">Team</a>
    <a href="/" class="is-active">Home</a>
    <a href="/">Home</a>
    <a href="/nested/">Page</a>
    <a href="/nested/" class="is-active">Page</a>
    <a href="../../nested/page/" class="is-active">Link With relativePath</a>
  `;

  return acetate.renderPage(page).then(output => {
    const outputLines = output.split("\n");
    const expectedLines = expected.split("\n");
    const templateLines = expected.split("\n");
    outputLines.forEach((line, i) => {
      t.is(line, expectedLines[i], templateLines[i]);
    });
  });
});

test("should add stats to pages loaded from templates", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    log: "silent"
  });

  return acetate
    .getPages()
    .then(pages => {
      return acetate.transformPage(pages[0]);
    })
    .then(page => {
      t.true(page.stats.mtime instanceof Date);
    });
});

test("should not add stats for non-template based pages", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    log: "silent"
  });

  const page = createPage("index.html", "Home");

  return acetate.transformPage(page).then(function(page) {
    t.is(page.stats, undefined);
  });
});

test("raise an error if there is an error getting stats", t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, "acetate-configs"),
    log: "silent"
  });

  const page = createPage("index.html", "Home");
  page.templatePath = path.join(acetate.sourceDir, "does-not-exist.html");

  return t.throws(acetate.transformPage(page));
});
