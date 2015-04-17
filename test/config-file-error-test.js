var Acetate = require('../lib/Acetate');
var test = require('tape');

var site = new Acetate();
var logs = [];

site.on('log', function (e) {
  logs.push(e);
});

site.init({
  config: 'fixtures/error.conf.js',
  root: __dirname,
  log: 'silent'
});

test('should log an error if error in config file', function (t) {
  t.plan(1);

  var expected = {
    level: 'error',
    category: 'config',
    text: 'error in config file - thrown error in config file - fixtures/error.conf.js:2:9'
  };

  t.deepEqual(logs[0], expected);
});
