var test = require('tape');
var utils = require('../utils');
var path = require('path');
var _ = require('lodash');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  var logs = [];

  site.on('log', function (e) {
    logs.push(e);
  });

  site.once('build', function () {
    test('should build a page with data from a module', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'dynamic-data', 'index.html');
      var expected = path.join('expected', 'dynamic-data.html');

      utils.equal(t, root, output, expected);
    });

    test('should build a page with data from a json file', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'json-data', 'index.html');
      var expected = path.join('expected', 'json-data.html');

      utils.equal(t, root, output, expected);
    });

    test('should build a page with data from a yaml file', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'yaml-data', 'index.html');
      var expected = path.join('expected', 'yaml-data.html');

      utils.equal(t, root, output, expected);
    });

    test('should build a page with data from a yml file', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'yml-data', 'index.html');
      var expected = path.join('expected', 'yml-data.html');

      utils.equal(t, root, output, expected);
    });

    test('should build a page with global data from config file', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'global-data', 'index.html');
      var expected = path.join('expected', 'global-data.html');

      utils.equal(t, root, output, expected);
    });

    test('should override global with a local declaration', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'override-data', 'index.html');
      var expected = path.join('expected', 'override-data.html');

      utils.equal(t, root, output, expected);
    });

    test('should be able to require many data files', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'all-data', 'index.html');
      var expected = path.join('expected', 'all-data.html');

      utils.equal(t, root, output, expected);
    });

    test('should log a warning when error passed to dynamic data callback', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var expected = {
        show: false,
        level: 'warn',
        category: 'data',
        text: 'error passed to data callback - src' + path.sep + 'invalid' + path.sep + 'callbackError.js:2:12'
      };

      var log = _.where(logs, expected)[0];

      t.deepEqual(log, expected);
    });

    test('should log a warning when error thrown in dynamic data callback', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var expected = {
        show: false,
        level: 'warn',
        category: 'data',
        text: 'error thrown in data file - src' + path.sep + 'invalid' + path.sep + 'syntaxError.js:2:9'
      };

      var log = _.where(logs, expected)[0];

      t.deepEqual(log, expected);
    });

    test('should log a warning when loading invalid YAML', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var expected = {
        show: false,
        level: 'warn',
        category: 'data',
        text: 'invalid YAML in invalid/invalid.yaml - bad indentation of a mapping entry at line 2, column 2'
      };

      var log = _.where(logs, expected)[0];

      t.deepEqual(log, expected);
    });

    test('should log a warning when loading invalid JSON', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var expected = {
        show: false,
        level: 'warn',
        category: 'data',
        text: 'invalid JSON in invalid/invalid.json - SyntaxError: Unexpected token e'
      };

      var log = _.where(logs, expected)[0];

      t.deepEqual(log, expected);
    });
  });
});
