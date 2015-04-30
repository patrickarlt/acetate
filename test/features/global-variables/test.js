var test = require('tape');
var utils = require('../utils');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('should build a page with a global', function (t) {
      t.plan(1);

      var output = 'build/global/index.html';
      var expected = 'expected/global.html';

      utils.equal(t, root, output, expected);
    });
  });
});
