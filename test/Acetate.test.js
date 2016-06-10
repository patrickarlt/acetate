const test = require('ava');
const fs = require('fs');
const path = require('path');
const Acetate = require('../lib/Acetate.js');
const { createTempFixtures, removeTempFixtures } = require('./util.js');
const { stripIndent } = require('common-tags');
const createPage = require('../lib/createPage');

test.beforeEach(createTempFixtures);
test.afterEach(removeTempFixtures);

test('load a basic config file', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    logLevel: 'silent'
  });

  return acetate.loader.getPages().then(pages => {
    t.is(pages[0].src, 'foo/markdown.md');
    t.is(pages[1].src, 'index.html');
  });
});

test('should seperate the configuration over multiple files', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    config: 'with-require.config.js',
    logLevel: 'silent'
  });

  return acetate.loader.getPages().then(pages => {
    t.is(pages[0].src, 'foo/markdown.md');
    t.is(pages[1].src, 'index.html');
  });
});

test.cb('should watch config file for changes and reload the configuration', t => {
  const root = path.join(t.context.temp, 'acetate-configs');
  const configPath = path.join(root, 'acetate.config.js');
  const acetate = new Acetate({
    root,
    logLevel: 'silent'
  });

  const newConfig = stripIndent`
    module.exports = function (acetate) {
      acetate.load('**/*.html');
    }
  `;

  acetate.once('config:watcher:ready', function () {
    acetate.once('config:loaded', function () {
      acetate.stopWatcher();
      acetate.loader.getPages().then(function (pages) {
        t.is(pages.length, 1);
        t.end();
      });
    });

    fs.writeFile(configPath, newConfig, function (error) {
      if (error) {
        t.fail('Could not write new config file to ${configPath}');
      }
    });
  });

  acetate.startWatcher();
});

test('should throw if an invalid config is loaded', t => {
  t.throws(function () {
    new Acetate({// eslint-disable-line no-new
      root: path.join(t.context.temp, 'acetate-configs'),
      config: 'with-error.config.js',
      logLevel: 'silent'
    });
  });
});

test.cb('should emit an error if the config throws an error while the watcher is running', t => {
  const root = path.join(t.context.temp, 'acetate-configs');
  const configPath = path.join(root, 'acetate.config.js');
  const acetate = new Acetate({
    root,
    logLevel: 'silent'
  });

  const newConfig = stripIndent`
    module.exports = function (acetate) {
      acetate.load('**/*.html);
    }
  `;

  acetate.once('config:watcher:ready', function () {
    acetate.once('config:error', function (e) {
      t.is(e.error.name, 'AcetateConfigError');
      t.end();
    });

    fs.writeFile(configPath, newConfig, function (error) {
      if (error) {
        t.fail('Could not write new config file to ${configPath}');
      }
    });
  });

  acetate.startWatcher();
});

test.cb('should emit an error if the config throws an error while the watcher is running', t => {
  const root = path.join(t.context.temp, 'acetate-configs');
  const configPath = path.join(root, 'acetate.config.js');
  const acetate = new Acetate({
    root,
    logLevel: 'silent'
  });

  const newConfig = stripIndent`
    module.exports = function (acetate) {
      acetate.load(foo);
    }
  `;

  acetate.once('config:watcher:ready', function () {
    acetate.once('config:error', function (e) {
      t.is(e.error.name, 'AcetateConfigError');
      t.end();
    });

    fs.writeFile(configPath, newConfig, function (error) {
      if (error) {
        t.fail('Could not write new config file to ${configPath}');
      }
    });
  });

  acetate.startWatcher();
});

test('should render markdown with a built in helper', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    logLevel: 'silent'
  });

  const page = createPage('index.html', stripIndent`
    {% markdown %}
      # Markdown
    {% endmarkdown %}
  `);

  return acetate.renderer.renderPage(page).then(output => {
    t.is(output, '<h1>Markdown</h1>');
  });
});

test('should highlight code with a built in helper', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    logLevel: 'silent'
  });

  const page = createPage('index.html', stripIndent`
    {% highlight %}
    var foo = bar;
    {% endhighlight %}

    {% highlight 'js' %}
    var foo = bar;
    {% endhighlight %}
  `);

  const expected = stripIndent`
    <pre><code class="actionscript"><span class="hljs-keyword">var</span> foo = bar;</code></pre>

    <pre><code class="js"><span class="hljs-keyword">var</span> foo = bar;</code></pre>
  `;

  return acetate.renderer.renderPage(page).then(output => {
    t.is(output, expected);
  });
});

test('should create anchors code with a built in helper', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    logLevel: 'silent'
  });

  const page = createPage('nested/page/index.html', stripIndent`
    {% link '/', 'Home' %}
    {% link '/', 'Home', 'data-foo'='Foo', 'data-bar'='Bar' %}
    {% link '/', 'Home', id="logo", class="nav-link" %}
    {% link '../', 'Back' %}
    {% link '../', 'Back', class="back-link" %}
    {% link '../', 'Back', class="back-link", activeClass="active" %}
    {% link '/nested/', 'Back', requireExactMatch=true %}
    {% link 'http://example.com', 'Example', class="external-link" %}
    {% link '//example.com', 'Example' %}
  `);

  const expected = stripIndent`
    <a href="/">Home</a>
    <a href="/" data-foo="Foo" data-bar="Bar">Home</a>
    <a href="/" id="logo" class="nav-link">Home</a>
    <a href="/nested/" class="is-active">Back</a>
    <a href="/nested/" class="is-active back-link">Back</a>
    <a href="/nested/" class="active back-link">Back</a>
    <a href="/nested/">Back</a>
    <a href="http://example.com" class="external-link">Example</a>
    <a href="//example.com">Example</a>
  `;

  return acetate.renderer.renderPage(page).then(output => {
    t.is(output, expected);
  });
});

test('should add stats to pages loaded from templates', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    logLevel: 'silent'
  });

  return acetate.loader.getPages()
    .then((pages) => {
      return acetate.transformer.transformPages(pages);
    })
    .then(pages => {
      t.true(pages[0].stats.mtime instanceof Date);
    });
});
