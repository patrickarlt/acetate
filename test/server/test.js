var test = require('tape');
var utils = require('../utils');
var root = __dirname;
var request = require('request');

utils.start({
  log: 'silent',
  mode: 'server',
  root: root,
  host: 'localhost',
  port: 8000,
  open: false
}, function (site) {
  site.once('server:ready', function (e) {
    test('it should serve a page that exists', function (t) {
      t.plan(1);
      t.timeoutAfter(3000);

      request('http://localhost:8000/', {
        timeout: 1000
      }, function (error, response, body) {
        if (error) {
          t.fail();
          return;
        }

        t.equal(body, 'Hello!');
        site.cleanup();
      });
    });
  });
});
