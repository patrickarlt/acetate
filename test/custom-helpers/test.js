var test = require('tape');
var utils = require('../utils');
var path = require('path');
var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  var logs = [];

  site.on('log', function (e) {
    logs.push(e);
  });

  site.once('clean', function () {
    logs = [];
  });

  site.once('build', function () {
    test('should build a page with a custom helper with params', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'helper-with-params', 'index.html');
      var expected = path.join('expected', 'helper-with-params.html');

      utils.equal(t, root, output, expected);
    });

    test('should build a page with a custom helper with params', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'helper-no-params', 'index.html');
      var expected = path.join('expected', 'helper-no-params.html');

      utils.equal(t, root, output, expected);
    });

    test('should build a page with a custom block', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'block', 'index.html');
      var expected = path.join('expected', 'block.html');

      utils.equal(t, root, output, expected);
    });

    test('should build a page with a custom filter', function (t) {
      t.plan(1);
      t.timeoutAfter(500);

      var output = path.join('build', 'filter', 'index.html');
      var expected = path.join('expected', 'filter.html');

      utils.equal(t, root, output, expected);
    });
  });
});
