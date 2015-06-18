var test = require('tape');
var utils = require('../utils');
var root = __dirname;
var request = require('request');

utils.start({
  log: 'info',
  server: true,
  root: root
}, function (site) {
  site.once('server:start', function (e) {
    var base = 'http://' + e.host + ':' + e.port;

    test('it should serve a page that exists', function (t) {
      t.plan(1);
      t.timeoutAfter(3000);

      request(base, {
        timeout: 1000
      }, function (error, response, body) {
        if (error) {
          t.fail();
          return;
        }
        t.equal(body, 'Hello!');
      });
    });

    test('it should serve a 404 page if a page does not exist', function (t) {
      t.plan(1);
      t.timeoutAfter(3000);

      request(base + '/not-found/', {
        timeout: 1000
      }, function (error, response, body) {
        site.stopServer();
        site.stopWatcher();

        if (error) {
          t.fail();
          return;
        }

        t.equal(body, '404');
      });
    });
  });
});
