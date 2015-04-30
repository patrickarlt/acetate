var test = require('tape');
var utils = require('../utils');
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
    test('should build a page with a custom helper', function (t) {
      t.plan(1);

      var output = 'build/helper/index.html';
      var expected = 'expected/helper.html';

      utils.equal(t, root, output, expected);
    });

    test('should build a page with a custom block', function (t) {
      t.plan(1);

      var output = 'build/block/index.html';
      var expected = 'expected/block.html';

      utils.equal(t, root, output, expected);
    });

    test('should build a page with a custom filter', function (t) {
      t.plan(1);

      var output = 'build/filter/index.html';
      var expected = 'expected/filter.html';

      utils.equal(t, root, output, expected);
    });
  });
});
