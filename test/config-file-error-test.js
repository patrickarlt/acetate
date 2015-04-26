var acetate = require('../index');
var test = require('tape');
var _ = require('lodash');

var site = acetate({
  config: 'fixtures/error.conf.js',
  root: __dirname,
  log: 'silent'
});

var logs = [];

site.on('log', function (e) {
  logs.push(e);
});

test('should log an error if error in config file', function (t) {
  t.plan(1);

  var expected = {
    level: 'error',
    category: 'config',
    text: 'error in config file - thrown error in config file - fixtures/error.conf.js:2:9'
  };

  t.deepEqual(_.where(logs, expected)[0], expected);
});
