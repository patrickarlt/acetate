var test = require('tape');
var utils = require('../utils');
var fs = require('fs');
var path = require('path');

var root = __dirname;

utils.start({
  log: 'silent',
  watcher: true,
  root: root
}, function (site) {
  var filepath = path.join(__dirname, site.src, 'index.html');

  test('should build a file when an added event is fired', function (t) {
    t.plan(1);
    t.timeoutAfter(3000);

    site.once('watcher:ready', function () {
      fs.writeFile(filepath, 'added', function () {
        site.once('build', function () {
          var output = path.join('build', 'index.html');
          var expected = path.join('expected', 'index-added.html');

          utils.equal(t, root, output, expected);
        });
      });
    });
  });

  test('should re-build a file when a changed event is fired', function (t) {
    t.plan(1);
    t.timeoutAfter(3000);

    fs.appendFile(filepath, '\nchanged', function () {
      site.once('build', function () {
        var output = path.join('build', 'index.html');
        var expected = path.join('expected', 'index-changed.html');

        utils.equal(t, root, output, expected);
      });
    });
  });

  test('should remove a file when an unlink event is fired', function (t) {
    t.plan(2);
    t.timeoutAfter(3000);

    fs.unlink(filepath, function () {
      site.once('page:clean', function () {
        t.notOk(site.util.exists(path.join(__dirname, site.dest, 'index.html')));
        t.equal(site.pages.length, 0, 'page should be removed from pages array');
        site.stopWatcher();
      });
    });
  });
});
