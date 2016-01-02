var tap = require('tap');
var path = require('path');
var utils = require('../utils');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    tap.test('should build a dynamic page with inline nunjucks template', function (t) {
      var output = path.join('build', 'inline', 'index.html');
      var expected = path.join('expected', 'inline.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });

    tap.test('should build a dynamic page with external nunjucks template', function (t) {
      var output = path.join('build', 'external', 'index.html');
      var expected = path.join('expected', 'external.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });

    tap.test('should build a dynamic page with markdown', function (t) {
      var output = path.join('build', 'markdown', 'index.html');
      var expected = path.join('expected', 'markdown.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });
  });
});
