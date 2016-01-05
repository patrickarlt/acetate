var tap = require('tap');
var path = require('path');
var utils = require('../utils');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    tap.test('should run extensions within extensions', function (t) {
      var output = path.join('build', 'index.html');
      var expected = path.join('expected', 'index.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });
  });
});