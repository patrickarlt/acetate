var test = require('tape');
// var utils = require('../utils');
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

site.once('build', function (e) {
  test('should log an error when Nunjucks throws an error', function (t) {
    t.plan(1);

    var expected = {
      level: 'error',
      category: 'page',
      text: 'error building templateError.html - unknown block tag: undefined - src/templateError.html:1:2'
    };

    var log = _.where(logs, expected)[0];

    t.deepEqual(log, expected);
  });
});
