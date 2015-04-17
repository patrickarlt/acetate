var test = require('tape');
var utils = require('../utils');
var acetate = require('../../../index.js');
var _ = require('lodash');

var root = __dirname;

var site = acetate({
  log: 'info',
  root: root,
  clean: true
});

var logs = [];

site.on('log', function (e) {
  logs.push(e);
});

site.once('clean', function () {
  logs = [];
});

site.once('build', function () {
  test('should build a page with a custom helper', function (t) {
    t.plan(1);

    var output = 'build/helper/index.html';
    var expected = 'expected/helper.html';

    utils.equal(t, root, output, expected);
  });

  test('should build a page with a custom block', function (t) {
    t.plan(1);

    var output = 'build/block/index.html';
    var expected = 'expected/block.html';

    utils.equal(t, root, output, expected);
  });

  test('should build a page with a custom filter', function (t) {
    t.plan(1);

    var output = 'build/filter/index.html';
    var expected = 'expected/filter.html';

    utils.equal(t, root, output, expected);
  });

  test('should log an error when a helper hander throws an error', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building helper-error.html - error in custom helper "errorHelper" - acetate.conf.js:15:11'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });

  test('should log an error when a helper is called with no params', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building helper-no-params.html - You must pass at least one parameter to custom helper "helper"'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });

  test('should log an error when a filter hander throws an error', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building filter-error.html - error in custom filter "errorFilter" - acetate.conf.js:23:11'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });

  test('should log an error when a filter hander throws an error', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building filter-error.html - error in custom filter "errorFilter" - acetate.conf.js:23:11'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });

  test('should log an error when a filter hander throws an error', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building block-error.html - error in custom block "errorBlock" - acetate.conf.js:19:11'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });
});
