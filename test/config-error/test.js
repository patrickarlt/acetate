var acetate = require('../../index');
var test = require('tape');
var _ = require('lodash');

var site = acetate({
  config: 'error.conf.js',
  root: __dirname,
  log: 'silent'
});

var logs = [];

site.on('log', function (e) {
  logs.push(e);
});

test('should log an error if error in config file', function (t) {
  t.plan(1);
  t.timeoutAfter(500);

  var expected = {
    show: false,
    level: 'error',
    category: 'config',
    text: 'error in config file - thrown error in config file - error.conf.js:2:9'
  };

  t.deepEqual(_.where(logs, expected)[0], expected);
});
