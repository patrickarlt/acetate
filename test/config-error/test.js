var tap = require('tap');
var acetate = require('../../index');
var _ = require('lodash');

tap.test('should log an error if error in config file', function (t) {
  var site = acetate({
    config: 'error.conf.js',
    root: __dirname,
    log: 'silent'
  });

  var logs = [];

  site.on('log', function (e) {
    logs.push(e);
  });

  var expected = {
    show: false,
    level: 'error',
    category: 'config',
    text: 'error in config file - thrown error in config file - error.conf.js:2:9'
  };

  site.on('build', function () {
    t.deepEqual(_.where(logs, expected)[0], expected);
    t.end();
  });
});
