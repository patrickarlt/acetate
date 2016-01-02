var tap = require('tap');
var utils = require('../utils');
var path = require('path');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    tap.test('should build the site with custom directories', function (t) {
      var output = path.join('output', 'index.html');
      var expected = path.join('expected', 'index.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });
  });
});
