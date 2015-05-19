var test = require('tape');
var path = require('path');
var utils = require('../utils');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('should calculate relative url to root for a page one level deep', function (t) {
      t.plan(1);

      var output = path.join('build', 'one-deep', 'index.html');
      var expected = path.join('expected', 'one-deep', 'index.html');

      utils.equal(t, root, output, expected);
    });

    test('should calculate relative url to root for a page two levels deep', function (t) {
      t.plan(1);

      var output = path.join('build', 'one-deep', 'two-deep', 'index.html');
      var expected = path.join('expected', 'one-deep', 'two-deep', 'index.html');

      utils.equal(t, root, output, expected);
    });

    test('should calculate relative url to root for a page three levels deep', function (t) {
      t.plan(1);

      var output = path.join('build', 'one-deep', 'two-deep', 'three-deep', 'index.html');
      var expected = path.join('expected', 'one-deep', 'two-deep', 'three-deep', 'index.html');

      utils.equal(t, root, output, expected);
    });
  });
});
