var tap = require('tap');
var utils = require('../utils');
var path = require('path');
var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    tap.test('transform pages in place', function (t) {
      var output = path.join('build', 'transformed', 'index.html');
      var expected = path.join('expected', 'transformed.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });
  });
});
