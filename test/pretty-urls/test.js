var test = require('tape');
var utils = require('../utils');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('should build a page at root with a root url', function (t) {
      t.plan(1);

      var output = 'build/index.html';
      var expected = 'expected/index.html';

      utils.equal(t, root, output, expected);
    });

    test('should build a page at root without a pretty url', function (t) {
      t.plan(1);

      var output = 'build/not-pretty.html';
      var expected = 'expected/not-pretty.html';

      utils.equal(t, root, output, expected);
    });

    test('should build a page at root with a pretty url', function (t) {
      t.plan(1);

      var output = 'build/pretty/index.html';
      var expected = 'expected/pretty/index.html';

      utils.equal(t, root, output, expected);
    });

    test('should build an index page in a folder', function (t) {
      t.plan(1);

      var output = 'build/nested/index.html';
      var expected = 'expected/nested/index.html';

      utils.equal(t, root, output, expected);
    });

    test('should build a page in a folder without a pretty url', function (t) {
      t.plan(1);

      var output = 'build/nested/not-pretty.html';
      var expected = 'expected/nested/not-pretty.html';

      utils.equal(t, root, output, expected);
    });

    test('should build a page in a folder with a pretty url', function (t) {
      t.plan(1);

      var output = 'build/nested/pretty/index.html';
      var expected = 'expected/nested/pretty/index.html';

      utils.equal(t, root, output, expected);
    });

    test('should build an index page in a nested folder', function (t) {
      t.plan(1);

      var output = 'build/nested/nested/index.html';
      var expected = 'expected/nested/nested/index.html';

      utils.equal(t, root, output, expected);
    });

    test('should build a page in a nested folder without a pretty url', function (t) {
      t.plan(1);

      var output = 'build/nested/nested/not-pretty.html';
      var expected = 'expected/nested/nested/not-pretty.html';

      utils.equal(t, root, output, expected);
    });

    test('should build a page in a nested folder with a pretty url', function (t) {
      t.plan(1);

      var output = 'build/nested/nested/pretty/index.html';
      var expected = 'expected/nested/nested/pretty/index.html';

      utils.equal(t, root, output, expected);
    });

    test('should build a non-html without a pretty url', function (t) {
      t.plan(1);

      var output = 'build/plain.txt';
      var expected = 'expected/plain.txt';

      utils.equal(t, root, output, expected);
    });
  });
});
