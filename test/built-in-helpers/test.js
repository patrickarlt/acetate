var test = require('tape');
var utils = require('../utils');
var path = require('path');
var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('should build a page with the markdown helper', function (t) {
      t.plan(1);

      var output = path.join('build', 'markdown', 'index.html');
      var expected = path.join('expected', 'markdown.html');

      utils.equal(t, root, output, expected);
    });

    test('should build a page with the highlight helper', function (t) {
      t.plan(1);

      var output = path.join('build', 'highlight', 'index.html');
      var expected = path.join('expected', 'highlight.html');

      utils.equal(t, root, output, expected);
    });
  });
});
