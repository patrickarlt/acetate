const test = require("ava");
const path = require("path");
const fs = require("fs");
const Acetate = require("../lib/Acetate");
const createPage = require("../lib/createPage");
const { createTempFixtures } = require("./util.js");
const { stripIndent } = require("common-tags");
const sinon = require("sinon");

test.beforeEach(createTempFixtures);

test("should render a basic page", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const page = createPage("index.html", template, {
    title: "Home"
  });

  return acetate.renderPage(page).then(function(output) {
    t.is(output, "<h1>Home</h1>");
  });
});

test("should capture rendering errors and prettyify", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    <h1>{{throw new }}</h1>
  `;

  const page = createPage("index.html", template, {
    title: "Home"
  });

  return t.throws(acetate.renderPage(page)).then(e => {
    t.is(e.message, "expected variable end while rendering index.html(1:11)");
    t.is(e.name, "PageRenderError");
    t.is(e.file, "index.html");
    t.is(e.line, 1);
    t.is(e.column, 11);
  });
});

test("should be able to use {% include %} to include other pages", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    {% include '_partial' %}
  `;

  const page = createPage("index.html", template);

  return acetate.renderPage(page).then(output => {
    t.is(output, "Partial");
  });
});

test("extension on {% include %} should be optional", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    {% include '_partial.html' %}
  `;

  const page = createPage("index.html", template);

  return acetate.renderPage(page).then(output => {
    t.is(output, "Partial");
  });
});

test("should be able to use {% import %} to include exports from other templates", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    {% import '_vars.html' as vars %}
    {{ vars.foo }}
  `;

  const page = createPage("index.html", template);

  return acetate.renderPage(page).then(output => {
    t.is(output, "bar");
  });
});

test("should handle other Errors that get thrown in templates", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    {% import '_does-not-exist.html' as vars %}
    {{ vars.foo }}
  `;

  const page = createPage("index.html", template, {
    title: "Home"
  });

  return t.throws(acetate.renderPage(page)).then(e => {
    t.is(
      e.message,
      "TemplateNotFoundError: could not find template matching _does-not-exist.html (tried _does-not-exist.html) while rendering index.html"
    );
    t.is(e.name, "PageRenderError");
  });
});

test("should register a prerendering function", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const page = createPage("index.html", template);

  acetate.prerender("**/*", function(page, callback) {
    page.title = "Home";
    callback(null, page);
  });

  return acetate.renderPage(page).then(output => {
    t.is(output, "<h1>Home</h1>");
  });
});

test("should not prerender if a page does not match", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const page = createPage("index.html", template);

  const spy = sinon.spy();

  acetate.prerender("no/match", spy);

  return acetate.renderPage(page).then(output => {
    t.is(spy.callCount, 0);
  });
});

test("should reject if prerender function calls back with an error", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const page = createPage("index.html", template);

  acetate.prerender("**/*", function(page, callback) {
    process.nextTick(function() {
      callback("D'oh");
    });
  });

  return t.throws(acetate.renderPage(page)).then(error => {
    t.is(error, "D'oh");
  });
});

test("should reject if there is an error thrown in a prerender function", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const page = createPage("index.html", template);

  acetate.prerender("**/*", function(page, callback) {
    throw new Error("D'oh");
  });

  return t.throws(acetate.renderPage(page)).then(error => {
    t.is(error.message, "D'oh");
  });
});

test.cb("should be able to invalidate a template", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    {% include '_partial.html' %}
  `;

  const page = createPage("index.html", template);

  acetate.renderPage(page).then(output => {
    t.is(output, "Partial");

    fs.writeFile(
      path.join(t.context.temp, "renderer", "_partial.html"),
      "Change",
      error => {
        if (error) {
          t.fail(error);
          t.end();
          throw error;
        }

        acetate.invalidateTemplate("_partial");

        acetate.renderPage(page).then(output => {
          t.is(output, "Change");
          t.end();
        });
      }
    );
  });
});

test("should render a markdown page", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    # Markdown
  `;

  const page = createPage("index.md", template);

  return acetate.renderPage(page).then(output => {
    t.is(output, "<h1>Markdown</h1>");
  });
});

test("should still interpolate variables in a markdown page", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    # {{title}}

    [Test]({{relativePath}}/page.html)

    \`\`\`text
    {
      foo: {
        bar: "baz"
      }
    }
    \`\`\`
  `;

  const page = createPage("test/index.md", template, {
    title: "Markdown"
  });

  return acetate.renderPage(page).then(output => {
    t.is(
      output,
      stripIndent`
        <h1>Markdown</h1>
        <p><a href="../page.html">Test</a></p>
        <pre><code class="text">{
          foo: {
            bar: "baz"
          }
        }
        </code></pre>
    `
    );
  });
});

test("should render a markdown page in a layout", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    # {{title}}
  `;

  const expected = stripIndent`
    <main>
    <h1>Markdown</h1>
    </main>
  `;

  const page = createPage("index.md", template, {
    title: "Markdown",
    layout: "_layout:main"
  });

  return acetate.renderPage(page).then(output => {
    t.is(output, expected);
  });
});

test("should render a page in a layout", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const expected = stripIndent`
    <main>
    <h1>HTML</h1>
    </main>
  `;

  const page = createPage("index.html", template, {
    title: "HTML",
    layout: "_layout:main"
  });

  return acetate.renderPage(page).then(output => {
    t.is(output, expected);
  });
});

test.cb("should capture errors when rendering with a layout", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const page = createPage("index.html", template, {
    title: "HTML",
    layout: "_layout-error:main"
  });

  t.throws(acetate.renderPage(page)).then(error => {
    t.is(
      error.toString(),
      "PageRenderError: expected block end in < statement while rendering _layout-error.html(4:2)"
    );
    t.end();
  });
});

test("should syntax highlight code blocks", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  const template = stripIndent`
    \`\`\`
    var foo = bar;
    \`\`\`

    \`\`\`js
    var foo = bar;
    \`\`\`

    \`\`\`plain
    var foo = bar;
    \`\`\`

    \`\`\`text
    var foo = bar;
    \`\`\`
  `;

  const expected = stripIndent`
    <pre><code><span class="hljs-attribute">var foo</span> = bar;
    </code></pre>
    <pre><code class="js"><span class="hljs-keyword">var</span> foo = bar;
    </code></pre>
    <pre><code class="plain">var foo = bar;
    </code></pre>
    <pre><code class="text">var foo = bar;
    </code></pre>
  `;

  const page = createPage("index.md", template);

  return acetate.renderPage(page).then(output => {
    t.is(output, expected);
  });
});

test("should syntax highlight code blocks with a custom highlighter", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
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

  const template = stripIndent`
    \`\`\`
    var foo = bar;
    \`\`\`
  `;

  const expected = stripIndent`
    <pre><code>bar</code></pre>
  `;

  const page = createPage("index.md", template);

  return acetate.renderPage(page).then(output => {
    t.is(output, expected);
  });
});

test("should register a custom helper that can be used in templates", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  acetate.helper("title", function(context, prefix) {
    return `${prefix} | ${context.page.title}`;
  });

  const template = stripIndent`
    {% title 'My Site' %}
  `;

  const page = createPage("index.html", template, {
    title: "Home"
  });

  return acetate.renderPage(page).then(output => {
    t.is(output, "My Site | Home");
  });
});

test("should pass options with defaults to helpers", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  acetate.helper(
    "link",
    function(context, url, text) {
      t.is(context.options.class, "acetate-link");
      t.is(context.page.src, "index.html");
      t.is(url, "/");
      t.is(text, "Home");
      let classes =
        url === context.page.url
          ? context.options.activeClass
          : context.options.inactiveClass;
      return `<a href="${url}" class="${
        context.options.class
      } ${classes}">${text}</a>`;
    },
    {
      class: "acetate-link",
      activeClass: "is-active",
      inactiveClass: "is-inactive"
    }
  );

  const template = stripIndent`
    {% link activeClass="active", '/', 'Home' %}
  `;

  const page = createPage("index.html", template, {
    url: "/"
  });

  return acetate.renderPage(page).then(output => {
    t.is(output, '<a href="/" class="acetate-link active">Home</a>');
  });
});

test("should be able to handle errors thrown in custom helpers", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  acetate.helper("throw", function() {
    return nope.nope; // eslint-disable-line
  });

  const template = stripIndent`
    {% throw %}
  `;

  const page = createPage("index.html", template, {
    url: "/"
  });

  return t.throws(acetate.renderPage(page)).then(error => {
    t.regex(
      error.message,
      /CustomHelperError: error in custom helper `throw`: ReferenceError nope is not defined at .+\(\d+:\d+\) while rendering index\.html/
    );
  });
});

test("should register a custom block that can be used in templates", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  acetate.block(
    "codeblock",
    function(context, body, highlightAs) {
      t.is(context.options.classes, "javascript");
      t.is(context.page.src, "index.html");
      t.is(body, "var foo = 'bar';");
      t.is(highlightAs, "js");
      return `<pre><code class=${context.options.classes}>${body}</pre></code>`;
    },
    {
      classes: "text"
    }
  );

  const template = stripIndent`
    {% codeblock classes='javascript', 'js' %}
      var foo = 'bar';
    {% endcodeblock %}
  `;

  const page = createPage("index.html", template);

  return acetate.renderPage(page).then(output => {
    t.is(output, "<pre><code class=javascript>var foo = 'bar';</pre></code>");
  });
});

test("should register a custom filter that can be used in templates", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  acetate.filter("strong", function(value) {
    return `<strong>${value}</strong>`;
  });

  const template = stripIndent`
    {{ 'foo' | strong }}
  `;

  const page = createPage("index.html", template);

  return acetate.renderPage(page).then(output => {
    t.is(output, "<strong>foo</strong>");
  });
});

test("should allow passing arguments in filters", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  acetate.filter("wrapInTag", function(value, tag) {
    return `<${tag}>${value}</${tag}>`;
  });

  const template = stripIndent`
    {{ 'foo' | wrapInTag('strong') }}
  `;

  const page = createPage("index.html", template);

  return acetate.renderPage(page).then(output => {
    t.is(output, "<strong>foo</strong>");
  });
});

test("should catch errors in custom filters", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  acetate.filter("throw", function() {
    return nope.nope; // eslint-disable-line
  });

  const template = stripIndent`
    {{ 'foo' | throw }}
  `;

  const page = createPage("index.html", template);

  return t.throws(acetate.renderPage(page)).then(error => {
    t.regex(
      error.message,
      /CustomHelperError: error in custom filter `throw`: ReferenceError nope is not defined at .+\(\d+:\d+\) while rendering index\.html/
    );
  });
});

test("should register global variables", t => {
  const acetate = new Acetate({
    root: t.context.temp,
    sourceDir: "renderer",
    log: "silent",
    config: false
  });

  acetate.global("foo", "bar");

  const template = stripIndent`
    {{ foo }}
  `;

  const page = createPage("index.html", template);

  return acetate.renderPage(page).then(function(output) {
    t.is(output, "bar");
  });
});
