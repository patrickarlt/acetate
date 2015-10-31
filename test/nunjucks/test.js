var test = require('tape');
var utils = require('../utils');
var fs = require('fs');
var path = require('path');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('should build a page with a partial', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'page-1', 'index.html');
      var expected = path.join('expected', 'page-1.html');

      utils.equal(t, root, output, expected);
    });

    test('should build a page with a partial', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'page-2', 'index.html');
      var expected = path.join('expected', 'page-2.html');

      utils.equal(t, root, output, expected);
    });

    test('should not build ignored pages', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      fs.exists(path.join(root, 'build', 'ignore', 'index.html'), function (exists) {
        t.equals(exists, false, 'should not build ignored pages');
      });
    });
  });
});
