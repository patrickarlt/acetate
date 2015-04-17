var test = require('tape');
var utils = require('../utils');
var acetate = require('../../../index.js');
var _ = require('lodash');

var root = __dirname;

var site = acetate({
  log: 'silent',
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
  test('should render a page with multiple metadata blocks properly', function (t) {
    t.plan(1);

    var output = 'build/metadata-metadata/index.html';
    var expected = 'expected/metadata-metadata.html';

    utils.equal(t, root, output, expected);
  });

  test('should log an error when Nunjucks throws an error in a template with metadata', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building template-error-with-metadata.html - unknown block tag: undefined - src/template-error-with-metadata.html:5:2'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });

  test('should log an error when Nunjucks throws an error in a template no metadata', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building template-error-no-metadata.html - unknown block tag: undefined - src/template-error-no-metadata.html:1:2'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });

  test('should log an error when Nunjucks throws an error in a template leading newlines', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building template-error-leading-newlines.html - unknown block tag: undefined - src/template-error-leading-newlines.html:5:2'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });

  test('should log an error when a helper hander throws an error', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building helper-error.html - error in custom helper "errorHelper" - acetate.conf.js:3:11'
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
      text: 'error building filter-error.html - error in custom filter "errorFilter" - acetate.conf.js:11:11'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });

  test('should log an error when a block hander throws an error', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building block-error.html - error in custom block "errorBlock" - acetate.conf.js:7:11'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });
});
