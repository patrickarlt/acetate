var test = require('tape');
var utils = require('../utils');
var root = __dirname;
var request = require('request');

utils.start({
  log: 'debug',
  server: true,
  root: root
}, function (site) {
  site.once('server:start', function (e) {
    var base = 'http://' + e.host + ':' + e.port;

    test('it should serve a page that exists', function (t) {
      t.plan(1);
      request(base, function (error, response, body) {
        if (error) {
          t.fail();
          return;
        }
        t.equal(body, 'Hello!');
      });
    });

    test('it should serve a 404 page if a page does not exist', function (t) {
      t.plan(1);
      request(base + '/not-found/', function (error, response, body) {
        if (error) {
          t.fail();
          return;
        }
        t.equal(body, '404');
        site.stopServer();
        site.stopWatcher();
      });
    });
  });
});
