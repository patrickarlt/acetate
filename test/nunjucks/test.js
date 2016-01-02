var tap = require('tap');
var utils = require('../utils');
var fs = require('fs');
var path = require('path');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
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
  });
});
