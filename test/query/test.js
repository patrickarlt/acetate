var tap = require('tap');
var path = require('path');
var utils = require('../utils');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  site.once('build', function () {
    tap.test('should query pages and return the query result in templates', function (t) {
      var output = path.join('build', 'query', 'index.html');
      var expected = path.join('expected', 'query.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });
  });
});
