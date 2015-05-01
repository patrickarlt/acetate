var Static = require('node-static').Server;
var http = require('http');
var path = require('path');
var portscanner = require('portscanner');
var _ = require('lodash');

var MAX_PORTS = 30;

module.exports = function (acetate) {
  var files = new Static(path.join(acetate.root, acetate.dest), {
    cache: false
  });

  var notFoundPage;

  acetate._server = http.createServer(function (request, response) {
    request.addListener('end', function () {
      if (request.url !== '/favicon.ico') {
        acetate.debug('server', 'request recived for %s', request.url);
      }

      files.serve(request, response, function (error, result) {
        if (error && error.status === 404) {
          notFoundPage = notFoundPage || _.where(acetate.pages, {
            src: '404.html'
          })[0].dest;

          files.serveFile(notFoundPage, 404, {}, request, response);
        } else if (error) {
          response.writeHead(error.status, error.headers);
          response.end();
        }

        if (request.url !== '/favicon.ico') {
          if (error) {
            acetate.error('server', 'error serving %s - %s', request.url, error.message);
          } else {
            acetate.success('server', 'served %s', request.url);
          }
        }
      });
    }).resume();
  });

  var start = function (options) {
    portscanner.findAPortNotInUse(options.port, options.port + MAX_PORTS, options.host, function (error, port) {
      // if the found port doesn't match the option port, and we are forced to use the option port
      if (options.port !== port && options.findPort === false) {
        acetate.error('server', 'port %s is already in use', options.port);
        process.exit(1);
      } else {
        acetate._server.listen(port);
        acetate.info('server', 'started at %s:%s', options.host, port);
      }

      acetate.emit('server:start', {
        host: options.host,
        port: port
      });
    });
  };

  var stop = function () {
    acetate._server.close();
  };

  return {
    startServer: start,
    stopServer: stop
  };
};
