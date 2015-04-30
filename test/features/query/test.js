var test = require('tape');
var utils = require('../utils');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    test('should query pages and return the query result in templates', function (t) {
      t.plan(1);

      var output = 'build/query/index.html';
      var expected = 'expected/query.html';

      utils.equal(t, root, output, expected);
    });
  });
});
