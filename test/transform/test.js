var test = require('tape');
var utils = require('../utils');
var path = require('path');
var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('transform pages in place', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'transformed', 'index.html');
      var expected = path.join('expected', 'transformed.html');

      utils.equal(t, root, output, expected);
    });
  });
});
