var tap = require('tap');
var utils = require('../utils');
var fs = require('fs');
var path = require('path');

var root = __dirname;

utils.start({
  log: 'silent',
  mode: 'watch',
  root: root
}, function (site) {
  var filepath = path.join(__dirname, site.options.src, 'index.html');

  tap.test('should build a file when an added event is fired', function (t) {
    site.once('watcher:ready', function () {
      fs.writeFile(filepath, 'added', function () {
        site.once('build', function () {
          var output = path.join('build', 'index.html');
          var expected = path.join('expected', 'index-added.html');

          utils.equal(t, root, output, expected, function () {
            fs.appendFile(filepath, '\nchanged', function () {
              site.once('build', function () {
                var output = path.join('build', 'index.html');
                var expected = path.join('expected', 'index-changed.html');

                utils.equal(t, root, output, expected, function () {
                  fs.unlink(filepath, function () {
                    site.once('page:clean', function () {
                      t.notOk(site.util.exists(path.join(__dirname, site.options.dest, 'index.html')));
                      t.equal(site.pages.length, 0, 'page should be removed from pages array');
                      site.cleanup();
                      t.end();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
