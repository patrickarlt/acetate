const test = require('ava');
const path = require('path');
const fs = require('fs');
const Renderer = require('../lib/Renderer');
const createPage = require('../lib/createPage');
const { createTempFixtures, removeTempFixtures } = require('./util.js');
const { stripIndent } = require('common-tags');

test.beforeEach(createTempFixtures);
test.afterEach(removeTempFixtures);

test('should render a basic page', (t) => {
  const renderer = new Renderer({
    sourceDir: path.join(t.context.temp, 'renderer'),
    logLevel: 'silent'
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const page = createPage('index.html', template, {
    title: 'Home'
  });

  return renderer.renderPage(page).then(function (output) {
    t.is(output, '<h1>Home</h1>');
  });
});

test('should capture rendering errors and prettyify', (t) => {
  const renderer = new Renderer({
    sourceDir: path.join(t.context.temp, 'renderer'),
    logLevel: 'silent'
  });

  const template = stripIndent`
    <h1>{{throw new }}</h1>
  `;

  const page = createPage('index.html', template, {
    title: 'Home'
  });

  return t.throws(renderer.renderPage(page)).then(e => {
    t.is(e.message, 'expected variable end while rendering index.html(1:11)');
    t.is(e.name, 'PageRenderError');
    t.is(e.file, 'index.html');
    t.is(e.line, 1);
    t.is(e.column, 11);
  });
});

test('should be able to use {% include %} to include other pages', t => {
  const renderer = new Renderer({
    sourceDir: path.join(t.context.temp, 'renderer'),
    logLevel: 'silent'
  });

  const template = stripIndent`
    {% include '_partial' %}
  `;

  const page = createPage('index.html', template);

  return renderer.renderPage(page).then((output) => {
    t.is(output, 'Partial');
  });
});

test('extension on {% include %} should be optional', t => {
  const renderer = new Renderer({
    sourceDir: path.join(t.context.temp, 'renderer'),
    logLevel: 'silent'
  });

  const template = stripIndent`
    {% include '_partial.html' %}
  `;

  const page = createPage('index.html', template);

  return renderer.renderPage(page).then((output) => {
    t.is(output, 'Partial');
  });
});

test('should be able to use {% import %} to include exports from other templates', t => {
  const renderer = new Renderer({
    sourceDir: path.join(t.context.temp, 'renderer'),
    logLevel: 'silent'
  });

  const template = stripIndent`
    {% import '_vars.html' as vars %}
    {{ vars.foo }}
  `;

  const page = createPage('index.html', template);

  return renderer.renderPage(page).then((output) => {
    t.is(output, 'bar');
  });
});

test('should handle other Errors that get thrown in templates', t => {
  const renderer = new Renderer({
    sourceDir: path.join(t.context.temp, 'renderer'),
    logLevel: 'silent'
  });

  const template = stripIndent`
    {% import '_does-not-exist.html' as vars %}
    {{ vars.foo }}
  `;

  const page = createPage('index.html', template, {
    title: 'Home'
  });

  return t.throws(renderer.renderPage(page)).then(e => {
    t.is(e.message, 'TemplateNotFoundError: could not find template matching _does-not-exist.html (tried _does-not-exist.html) while rendering index.html');
    t.is(e.name, 'PageRenderError');
  });
});

test('should register a prerendering function', t => {
  const renderer = new Renderer({
    sourceDir: path.join(t.context.temp, 'renderer'),
    logLevel: 'silent'
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const page = createPage('index.html', template);

  renderer.prerender('**/*', function (page, callback) {
    page.title = 'Home';
    callback(null, page);
  });

  return renderer.renderPage(page).then((output) => {
    t.is(output, '<h1>Home</h1>');
  });
});

test('should reject if there is an error in a prerender function', t => {
  const renderer = new Renderer({
    sourceDir: path.join(t.context.temp, 'renderer'),
    logLevel: 'silent'
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const page = createPage('index.html', template);

  renderer.prerender('**/*', function (page, callback) {
    process.nextTick(function () {
      callback('D\'oh');
    });
  });

  return t.throws(renderer.renderPage(page)).then((error) => {
    t.is(error, 'D\'oh');
  });
});

test.cb('should be able to invalidate a template', t => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  const template = stripIndent`
    {% include '_partial.html' %}
  `;

  const page = createPage('index.html', template);

  renderer.renderPage(page).then((output) => {
    t.is(output, 'Partial');

    fs.writeFile(path.join(root, '_partial.html'), 'Change', (error) => {
      if (error) {
        t.fail(error);
        throw error;
      }

      renderer.invalidateTemplate('_partial');

      renderer.renderPage(page).then((output) => {
        t.is(output, 'Change');
        t.end();
      });
    });
  });
});

test('should render a markdown page', (t) => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  const template = stripIndent`
    # Markdown
  `;

  const page = createPage('index.md', template);

  return renderer.renderPage(page).then((output) => {
    t.is(output, '<h1>Markdown</h1>');
  });
});

test('should still interpolate variables in a markdown page', (t) => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  const template = stripIndent`
    # {{title}}
  `;

  const page = createPage('index.md', template, {
    title: 'Markdown'
  });

  return renderer.renderPage(page).then((output) => {
    t.is(output, '<h1>Markdown</h1>');
  });
});

test('should render a markdown page in a layout', (t) => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  const template = stripIndent`
    # {{title}}
  `;

  const expected = stripIndent`
    <main>
    <h1>Markdown</h1>
    </main>
  `;

  const page = createPage('index.md', template, {
    title: 'Markdown',
    layout: '_layout:main'
  });

  return renderer.renderPage(page).then((output) => {
    t.is(output, expected);
  });
});

test('should render a page in a layout', (t) => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  const template = stripIndent`
    <h1>{{title}}</h1>
  `;

  const expected = stripIndent`
    <main>
    <h1>HTML</h1>
    </main>
  `;

  const page = createPage('index.html', template, {
    title: 'HTML',
    layout: '_layout:main'
  });

  return renderer.renderPage(page).then((output) => {
    t.is(output, expected);
  });
});

test('should syntax highlight code blocks', (t) => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  const template = stripIndent`
    \`\`\`
    var foo = bar;
    \`\`\`

    \`\`\`js
    var foo = bar;
    \`\`\`
  `;

  const expected = stripIndent`
    <pre><code><span class="hljs-keyword">var</span> foo = bar;
    </code></pre>
    <pre><code class="js"><span class="hljs-keyword">var</span> foo = bar;
    </code></pre>
  `;

  const page = createPage('index.md', template);

  return renderer.renderPage(page).then((output) => {
    t.is(output, expected);
  });
});

test('should register a custom helper that can be used in templates', t => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  renderer.helper('title', function (context, prefix) {
    return `${prefix} | ${context.page.title}`;
  });

  const template = stripIndent`
    {% title 'My Site' %}
  `;

  const page = createPage('index.html', template, {
    title: 'Home'
  });

  return renderer.renderPage(page).then(output => {
    t.is(output, 'My Site | Home');
  });
});

test('should pass options with defaults to helpers', t => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  renderer.helper('link', function (context, url, text) {
    t.is(context.options.class, 'acetate-link');
    t.is(context.page.src, 'index.html');
    t.is(url, '/');
    t.is(text, 'Home');
    let classes = (url === context.page.url) ? context.options.activeClass : context.options.inactiveClass;
    return `<a href="${url}" class="${context.options.class} ${classes}">${text}</a>`;
  }, {
    class: 'acetate-link',
    activeClass: 'is-active',
    inactiveClass: 'is-inactive'
  });

  const template = stripIndent`
    {% link activeClass="active", '/', 'Home' %}
  `;

  const page = createPage('index.html', template, {
    url: '/'
  });

  return renderer.renderPage(page).then(output => {
    t.is(output, '<a href="/" class="acetate-link active">Home</a>');
  });
});

test('should be able to handle errors thrown in custom helpers', t => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  renderer.helper('throw', function () {
    return nope.nope; // eslint-disable-line
  });

  const template = stripIndent`
    {% throw %}
  `;

  const page = createPage('index.html', template, {
    url: '/'
  });

  return t.throws(renderer.renderPage(page)).then(error => {
    t.regex(error.message, /CustomHelperError: error in custom helper `throw`: ReferenceError nope is not defined at .+\(\d+:\d+\) while rendering index\.html/);
  });
});

test('should register a custom block that can be used in templates', t => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  renderer.block('codeblock', function (context, body, highlightAs) {
    t.is(context.options.classes, 'javascript');
    t.is(context.page.src, 'index.html');
    t.is(body, 'var foo = \'bar\';');
    t.is(highlightAs, 'js');
    return `<pre><code class=${context.options.classes}>${body}</pre></code>`;
  }, {
    classes: 'text'
  });

  const template = stripIndent`
    {% codeblock classes='javascript', 'js' %}
      var foo = 'bar';
    {% endcodeblock %}
  `;

  const page = createPage('index.html', template);

  return renderer.renderPage(page).then(output => {
    t.is(output, '<pre><code class=javascript>var foo = \'bar\';</pre></code>');
  });
});

test('should register a custom filter that can be used in templates', t => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  renderer.filter('strong', function (value) {
    return `<strong>${value}</strong>`;
  });

  const template = stripIndent`
    {{ 'foo' | strong }}
  `;

  const page = createPage('index.html', template);

  return renderer.renderPage(page).then(output => {
    t.is(output, '<strong>foo</strong>');
  });
});

test('should allow passing arguments in filters', t => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  renderer.filter('wrapInTag', function (value, tag) {
    return `<${tag}>${value}</${tag}>`;
  });

  const template = stripIndent`
    {{ 'foo' | wrapInTag('strong') }}
  `;

  const page = createPage('index.html', template);

  return renderer.renderPage(page).then(output => {
    t.is(output, '<strong>foo</strong>');
  });
});

test('should catch errors in custom filters', t => {
  const root = path.join(t.context.temp, 'renderer');

  const renderer = new Renderer({
    sourceDir: root,
    logLevel: 'silent'
  });

  renderer.filter('throw', function () {
    return nope.nope; // eslint-disable-line
  });

  const template = stripIndent`
    {{ 'foo' | throw }}
  `;

  const page = createPage('index.html', template);

  return t.throws(renderer.renderPage(page)).then(error => {
    t.regex(error.message, /CustomHelperError: error in custom filter `throw`: ReferenceError nope is not defined at .+\(\d+:\d+\) while rendering index\.html/);
  });
});

test.todo('should add a global variable');