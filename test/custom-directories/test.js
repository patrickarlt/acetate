var test = require('tape');
var utils = require('../utils');
var path = require('path');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('should build the site with custom directories', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('output', 'index.html');
      var expected = path.join('expected', 'index.html');

      utils.equal(t, root, output, expected);
    });
  });
});
