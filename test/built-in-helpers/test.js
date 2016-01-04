var tap = require('tap');
var utils = require('../utils');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');

var root = __dirname;

utils.start({
  log: 'silent',
  root: root
}, function (site) {
  var logs = [];

  site.on('log', function (e) {
    logs.push(e);
  });

  site.once('build', function () {
    tap.test('should build a page with the markdown helper', function (t) {
      var output = path.join('build', 'markdown', 'index.html');
      var expected = path.join('expected', 'markdown.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });

    tap.test('should build a page with the highlight helper', function (t) {
      var output = path.join('build', 'highlight', 'index.html');
      var expected = path.join('expected', 'highlight.html');

      utils.equal(t, root, output, expected, function () {
        t.end();
      });
    });

    tap.test('should print debug info for a single variable', function (t) {
      var log = _.filter(logs, function (log) {
        return (/^debug-var.html/).test(log.text);
      });

      t.ok(log[0]);

      fs.readFile(path.join(root, 'build', 'debug-var', 'index.html'), function (error, buffer) {
        if (error) {
          t.fail();
        }
        var output = buffer.toString();
        t.ok(/Debug Title/.test(output));
        t.ok(/<script>/.test(output));
        t.ok(/<\/script>/.test(output));
        t.end();
      });
    });

    tap.test('should print debug info for a all page variables', function (t) {
      var log = _.filter(logs, function (log) {
        return (/^debug-all.html/).test(log.text);
      });

      t.ok(log[0]);

      fs.readFile(path.join(root, 'build', 'debug-all', 'index.html'), function (error, buffer) {
        if (error) {
          t.fail();
        }

        var output = buffer.toString();
        t.ok(/Debug All/.test(output));
        t.ok(/<script>/.test(output));
        t.ok(/<\/script>/.test(output));
        t.end();
      });
    });
  });
});
