var tap = require('tap');
var path = require('path');
var utils = require('../utils');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    tap.test('should build a page with a global', function (t) {
      var output = path.join('build', 'global', 'index.html');
      var expected = path.join('expected', 'global.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });
  });
});
