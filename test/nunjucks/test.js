var tap = require('tap');
var utils = require('../utils');
var fs = require('fs');
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
    tap.test('should build a page with a partial', function (t) {
      var output = path.join('build', 'page-1', 'index.html');
      var expected = path.join('expected', 'page-1.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });

    tap.test('should build a page with a partial', function (t) {
      var output = path.join('build', 'page-2', 'index.html');
      var expected = path.join('expected', 'page-2.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });

    tap.test('should not build ignored pages', function (t) {
      fs.exists(path.join(root, 'build', 'ignore', 'index.html'), function (exists) {
        t.equals(exists, false, 'should not build ignored pages');
        t.end();
      });
    });

    tap.test('should log when a template is not found', function (t) {
      var expected = {
        show: false,
        level: 'error',
        category: 'nunjucks',
        text: 'could not find a template named _not-found'
      };

      t.deepEqual(_.where(logs, expected)[0], expected);
      t.end();
    });
  });
});
