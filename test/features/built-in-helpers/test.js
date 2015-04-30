var test = require('tape');
var utils = require('../utils');
var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('should build a page with the markdown helper', function (t) {
      t.plan(1);

      var output = 'build/markdown/index.html';
      var expected = 'expected/markdown.html';

      utils.equal(t, root, output, expected);
    });

    test('should build a page with the highlight helper', function (t) {
      t.plan(1);

      var output = 'build/highlight/index.html';
      var expected = 'expected/highlight.html';

      utils.equal(t, root, output, expected);
    });
  });
});
