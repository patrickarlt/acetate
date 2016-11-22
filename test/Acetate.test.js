const test = require('ava');
const fs = require('fs');
const path = require('path');
const Acetate = require('../lib/Acetate.js');
const { createTempFixtures } = require('./util.js');
const { stripIndent } = require('common-tags');
const createPage = require('../lib/createPage');
const sinon = require('sinon');

test.beforeEach(createTempFixtures);

test('load a basic config file', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
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
    log: 'silent'
  });

  return acetate.loader.getPages().then(pages => {
    t.is(pages[0].src, 'foo/markdown.md');
    t.is(pages[1].src, 'index.html');
  });
});

test('should impliment a plugin interface', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    config: 'blank.config.js',
    log: 'silent'
  });

  acetate.use(function (a) {
    a.load('**/*.+(md|html)');
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
    log: 'silent'
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
      log: 'silent'
    });
  });
});

test.cb('should emit an error if the config throws an error while the watcher is running', t => {
  const root = path.join(t.context.temp, 'acetate-configs');
  const configPath = path.join(root, 'acetate.config.js');
  const acetate = new Acetate({
    root,
    log: 'silent'
  });

  const newConfig = stripIndent`
    module.exports = function (acetate) {
      acetate.load('**/*.html);
    }
  `;

  acetate.once('config:watcher:ready', function () {
    acetate.once('config:error', function (e) {
      acetate.stopWatcher();

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
    log: 'silent'
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
    log: 'silent'
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

test('should render markdown included from another file with a built in helper', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
  });

  const page = createPage('index.html', stripIndent`
    {% markdown %}
      {% include '_markdown_partial.md'%}
    {% endmarkdown %}
  `);

  return acetate.renderer.renderPage(page).then(output => {
    t.is(output, '<h1>Markdown</h1>');
  });
});

test('should highlight code with a built in helper', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
  });

  const page = createPage('index.html', stripIndent`
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
  `);

  const expected = stripIndent`
    <pre><code class="ebnf"><span class="hljs-attribute">var foo</span> = bar;</code></pre>

    <pre><code class="js"><span class="hljs-keyword">var</span> foo = bar;</code></pre>

    <pre><code class="text">foo</code></pre>

    <pre><code class="plain">foo</code></pre>
  `;

  return acetate.renderer.renderPage(page).then(output => {
    t.is(output, expected);
  });
});

test('should create anchors code with a built in helper', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
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
    {% link '#team', 'Team' %}
    {% link '/', 'Home', currentUrl='/' %}
    {% link '/', 'Home', currentUrl='/nested/' %}
    {% link '/nested/', 'Page', currentUrl='/' %}
    {% link '/nested/', 'Page', currentUrl='/nested/' %}
  `;

  const page = createPage('nested/page/index.html', template);

  const expected = stripIndent`
    <a href="/">Home</a>
    <a href="/" data-foo="Foo" data-bar="Bar">Home</a>
    <a href="/" id="logo" class="nav-link">Home</a>
    <a href="/nested/" class="is-active">Back</a>
    <a href="/nested/" class="is-active back-link">Back</a>
    <a href="/nested/" class="active back-link">Back</a>
    <a href="/nested/">Back</a>
    <a href="/nested/page/" class="is-active">Page</a>
    <a href="http://example.com" class="external-link">Example</a>
    <a href="//example.com">Example</a>
    <a href="/about/#team">Team</a>
    <a href="/nested/page/#team" class="is-active">Team</a>
    <a href="#team" class="is-active">Team</a>
    <a href="/" class="is-active">Home</a>
    <a href="/">Home</a>
    <a href="/nested/">Page</a>
    <a href="/nested/" class="is-active">Page</a>
  `;

  return acetate.renderer.renderPage(page).then(output => {
    const outputLines = output.split('\n');
    const expectedLines = expected.split('\n');
    const templateLines = expected.split('\n');
    outputLines.forEach((line, i) => {
      t.is(line, expectedLines[i], templateLines[i]);
    });
  });
});

test('should add stats to pages loaded from templates', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
  });

  return acetate.loader.getPages()
    .then((pages) => {
      return acetate.transformer.transformPages(pages);
    })
    .then(pages => {
      t.true(pages[0].stats.mtime instanceof Date);
    });
});

test('should not add stats for non-template based pages', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
  });

  const page = createPage('index.html', 'Home');

  return acetate.transformer.transformPages([page]).then(function (pages) {
    t.is(pages[0].stats, undefined);
  });
});

test('raise an error if there is an error getting stats', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
  });

  const page = createPage('index.html', 'Home');
  page.templatePath = path.join(acetate.sourceDir, 'does-not-exist.html');

  return t.throws(acetate.transformer.transformPages([page]));
});

test('should proxy loader methods', function (t) {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
  });

  const loadSpy = sinon.spy(acetate.loader, 'load');

  acetate.load('**/*');

  t.true(loadSpy.calledWith('**/*'));
});

test('should proxy transformer methods', function (t) {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
  });

  const noop = function () {};

  const dataSpy = sinon.spy(acetate.transformer, 'data');
  const layoutSpy = sinon.spy(acetate.transformer, 'layout');
  const ignoreSpy = sinon.spy(acetate.transformer, 'ignore');
  const metadataSpy = sinon.spy(acetate.transformer, 'metadata');
  const transformSpy = sinon.spy(acetate.transformer, 'transform');
  const transformAllSpy = sinon.spy(acetate.transformer, 'transformAll');
  const transformAsyncSpy = sinon.spy(acetate.transformer, 'transformAsync');
  const transformAllAsyncSpy = sinon.spy(acetate.transformer, 'transformAllAsync');
  const generateSpy = sinon.spy(acetate.transformer, 'generate');
  const querySpy = sinon.spy(acetate.transformer, 'query');

  acetate.data('name', 'data.json');
  acetate.layout('**/*', '_layout:main');
  acetate.ignore('**/*');
  acetate.metadata('**/*', {foo: 'bar'});
  acetate.transform('**/*', noop);
  acetate.transformAll('**/*', noop);
  acetate.transformAsync('**/*', noop);
  acetate.transformAllAsync('**/*', noop);
  acetate.generate(noop);
  acetate.query('foo', noop, noop, noop);

  t.true(dataSpy.calledWith('name', 'data.json'));
  t.true(layoutSpy.calledWith('**/*', '_layout:main'));
  t.true(ignoreSpy.calledWith('**/*'));
  t.true(metadataSpy.calledWith('**/*', {foo: 'bar'}));
  t.true(transformSpy.calledWith('**/*', noop));
  t.true(transformAllSpy.calledWith('**/*', noop));
  t.true(transformAsyncSpy.calledWith('**/*', noop));
  t.true(transformAllAsyncSpy.calledWith('**/*', noop));
  t.true(generateSpy.calledWith(noop));
  t.true(querySpy.calledWith('foo', noop, noop, noop));
});

test('should proxy renderer methods', function (t) {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
  });

  const noop = function () {};

  const prerenderSpy = sinon.spy(acetate.renderer, 'prerender');
  const helperSpy = sinon.spy(acetate.renderer, 'helper');
  const blockSpy = sinon.spy(acetate.renderer, 'block');
  const filterSpy = sinon.spy(acetate.renderer, 'filter');
  const globalSpy = sinon.spy(acetate.renderer, 'global');

  acetate.prerender('**/*', noop);
  acetate.helper('helper', noop, {});
  acetate.block('block', noop, {});
  acetate.filter('filter', noop);
  acetate.global('global', true);

  t.true(prerenderSpy.calledWith('**/*', noop));
  t.true(helperSpy.calledWith('helper', noop, {}));
  t.true(blockSpy.calledWith('block', noop, {}));
  t.true(filterSpy.calledWith('filter', noop));
  t.true(globalSpy.calledWith('global', true));
});

test('should proxy logger methods', function (t) {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
  });

  const logSpy = sinon.spy(acetate.logger, 'log');
  const debugSpy = sinon.spy(acetate.logger, 'debug');
  const infoSpy = sinon.spy(acetate.logger, 'info');
  const successSpy = sinon.spy(acetate.logger, 'success');
  const warnSpy = sinon.spy(acetate.logger, 'warn');
  const errorSpy = sinon.spy(acetate.logger, 'error');
  const timeSpy = sinon.spy(acetate.logger, 'time');
  const timeEndSpy = sinon.spy(acetate.logger, 'timeEnd');

  acetate.log('error', 'foo', 'bar');
  acetate.debug('foo', 'bar');
  acetate.info('foo', 'bar');
  acetate.success('foo', 'bar');
  acetate.warn('foo', 'bar');
  acetate.error('foo', 'bar');
  acetate.time('foo');
  acetate.timeEnd('foo');

  t.true(logSpy.calledWith('error', 'foo', 'bar'));
  t.true(debugSpy.calledWith('foo', 'bar'));
  t.true(infoSpy.calledWith('foo', 'bar'));
  t.true(successSpy.calledWith('foo', 'bar'));
  t.true(warnSpy.calledWith('foo', 'bar'));
  t.true(errorSpy.calledWith('foo', 'bar'));
  t.true(timeSpy.calledWith('foo'));
  t.true(timeEndSpy.calledWith('foo'));
});

test('should proxy event emitter methods', function (t) {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'acetate-configs'),
    log: 'silent'
  });

  const noop = function () {};

  const addListenerSpy = sinon.spy(acetate.emitter, 'addListener');
  const emitSpy = sinon.spy(acetate.emitter, 'emit');
  const eventNamesSpy = sinon.spy(acetate.emitter, 'eventNames');
  const getMaxListenersSpy = sinon.spy(acetate.emitter, 'getMaxListeners');
  const listenerCountSpy = sinon.spy(acetate.emitter, 'listenerCount');
  const listenersSpy = sinon.spy(acetate.emitter, 'listeners');
  const onSpy = sinon.spy(acetate.emitter, 'on');
  const onceSpy = sinon.spy(acetate.emitter, 'once');
  const prependListenerSpy = sinon.spy(acetate.emitter, 'prependListener');
  const prependOnceListenerSpy = sinon.spy(acetate.emitter, 'prependOnceListener');
  const removeAllListenersSpy = sinon.spy(acetate.emitter, 'removeAllListeners');
  const removeListenerSpy = sinon.spy(acetate.emitter, 'removeListener');
  const setMaxListenersSpy = sinon.spy(acetate.emitter, 'setMaxListeners');

  acetate.addListener('foo', noop);
  acetate.emit('foo', 'e');
  acetate.eventNames();
  acetate.getMaxListeners();
  acetate.listenerCount();
  acetate.listeners('foo');
  acetate.on('foo', noop);
  acetate.once('foo', noop);
  acetate.prependListener('foo', noop);
  acetate.prependOnceListener('foo', noop);
  acetate.removeAllListeners('foo');
  acetate.removeListener('foo', noop);
  acetate.setMaxListeners(Infinity);

  t.true(addListenerSpy.calledWith('foo', noop));
  t.true(emitSpy.calledWith('foo', 'e'));
  t.true(eventNamesSpy.calledWith());
  t.true(getMaxListenersSpy.calledWith());
  t.true(listenerCountSpy.calledWith());
  t.true(listenersSpy.calledWith('foo'));
  t.true(onSpy.calledWith('foo', noop));
  t.true(onceSpy.calledWith('foo', noop));
  t.true(prependListenerSpy.calledWith('foo', noop));
  t.true(prependOnceListenerSpy.calledWith('foo', noop));
  t.true(removeAllListenersSpy.calledWith('foo'));
  t.true(removeListenerSpy.calledWith('foo', noop));
  t.true(setMaxListenersSpy.calledWith(Infinity));
});
