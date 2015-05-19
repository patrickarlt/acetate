var test = require('tape');
var path = require('path');
var utils = require('../utils');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('should build a markdown page', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'markdown', 'index.html');
      var expected = path.join('expected', 'markdown.html');

      utils.equal(t, root, output, expected);
    });
  });
});
