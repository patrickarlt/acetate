var test = require('tape');
var utils = require('../utils');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('transform pages in place', function (t) {
      t.plan(1);

      var output = 'build/transformed/index.html';
      var expected = 'expected/transformed.html';

      utils.equal(t, root, output, expected);
    });
  });
});
