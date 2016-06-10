const test = require('ava');
const fs = require('fs');
const path = require('path');
const Loader = require('../lib/Loader.js');
const { createTempFixtures, removeTempFixtures } = require('./util.js');

test.beforeEach(createTempFixtures);
test.afterEach(removeTempFixtures);

test('load pages with a glob', t => {
  const loader = new Loader({
    sourceDir: path.join(t.context.temp, 'loader-basic'),
    logLevel: 'silent'
  });

  loader.load('**/*.+(md|html)');

  return loader.getPages().then(pages => {
    t.is(pages[0].src, 'index.html');
  });
});

test('should throw if there is an error loading any page', t => {
  const loader = new Loader({
    sourceDir: path.join(t.context.temp, 'loader-error'),
    logLevel: 'silent'
  });

  loader.load('**/*.+(md|html)');

  return t.throws(loader.getPages()).then(e => {
    t.is(e.name, 'MetadataParseError');
    t.is(e.message, 'duplicated mapping key at index.html(2:8)');
    t.is(e.line, 2);
    t.is(e.column, 8);
    t.is(e.file, 'index.html');
  });
});

test.cb('the watcher should add pages when they are created', t => {
  const sourceDir = path.join(t.context.temp, 'loader-basic');
  const addition = path.join(sourceDir, 'addition.html');

  const loader = new Loader({
    sourceDir,
    logLevel: 'silent'
  });

  loader.load('**/*.+(md|html)');

  loader.getPages().then(function () {
    loader.emitter.once('watcher:ready', () => {
      fs.writeFile(addition, 'File Added', function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    loader.emitter.once('watcher:add', (page) => {
      loader.stopWatcher();
      t.is(page.src, 'addition.html');
      t.is(page.template, 'File Added');

      loader.getPages().then(pages => {
        t.is(pages.length, 2);
        t.end();
      }).catch((error) => {
        t.fail(error);
        t.end();
      });
    });

    loader.startWatcher();
  });
});

test.cb('the watcher should update pages when they are changed', t => {
  const sourceDir = path.join(t.context.temp, 'loader-basic');
  const change = path.join(sourceDir, 'index.html');

  const loader = new Loader({
    sourceDir,
    logLevel: 'silent'
  });

  loader.load('**/*.+(md|html)');

  loader.getPages().then(function () {
    loader.emitter.once('watcher:ready', () => {
      fs.writeFile(change, '<h1>Index Changed</h1>', function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    loader.emitter.once('watcher:change', (page) => {
      loader.stopWatcher();
      t.is(page.src, 'index.html');
      t.is(page.template, '<h1>Index Changed</h1>');
      loader.getPages().then(pages => {
        t.is(pages.length, 1);
        t.end();
      }).catch((error) => {
        t.fail(error);
        t.end();
      });
    });

    loader.startWatcher();
  });
});

test.cb('the watcher should remove pages when they are deleted', t => {
  const sourceDir = path.join(t.context.temp, 'loader-basic');
  const remove = path.join(sourceDir, 'index.html');

  const loader = new Loader({
    sourceDir,
    logLevel: 'silent'
  });

  loader.load('**/*.+(md|html)');

  loader.getPages().then(function () {
    loader.emitter.once('watcher:ready', () => {
      fs.unlink(remove, function (error) {
        if (error) {
          t.fail(error);
          t.end();
        }
      });
    });

    loader.emitter.once('watcher:delete', (page) => {
      loader.stopWatcher();
      t.is(page.src, 'index.html');
      t.is(page.template, '<h1>index.html</h1>');
      loader.getPages().then(pages => {
        t.is(pages.length, 0);
        t.end();
      }).catch((error) => {
        t.fail(error);
        t.end();
      });
    });

    loader.startWatcher();
  });
});
