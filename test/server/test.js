var tap = require('tap');
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
    tap.test('it should serve a page that exists', function (t) {
      request('http://localhost:8000/', {
        timeout: 1000
      }, function (error, response, body) {
        if (error) {
          t.fail();
          return;
        }

        t.equal(body, 'Hello!');
        site.cleanup();
        t.end();
      });
    });
  });
});
