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

      var output = path.join('build', 'index.html');
      var expected = path.join('expected', 'index.html');

      utils.equal(t, root, output, expected);
    });

    test('should not build ignored pages', function (t) {
      t.plan(1);

      fs.exists(path.join(root, 'build', 'ignore', 'index.html'), function (exists) {
        t.equals(exists, false, 'should not build ignored pages');
      });
    });
  });
});
