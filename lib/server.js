var static = require('node-static');
var http = require('http');
var path = require('path');
var portscanner = require('portscanner');
var opener = require('opener');
var _ = require('lodash');

var MAX_PORTS = 30;

function AcetateServer(acetate){
  var files = new static.Server(path.join(acetate.root, acetate.dest), {
    cache: false
  });

  this.acetate = acetate;

  var notFoundPage;

  this.server = http.createServer(function(request, response){
    request.addListener('end', function() {
      if(request.url !== '/favicon.ico'){
        acetate.log.debug('server', 'request recived for %s', request.url);
      }

      files.serve(request, response, function (error, result) {
        if (error && error.status === 404 && acetate.notFound) {
          notFoundPage = notFoundPage || _.where(acetate.pages, {
            src: acetate.notFound
          })[0].dest;

          files.serveFile(notFoundPage, 404, {}, request, response);
        } else if (error) {
          response.writeHead(error.status, error.headers);
          response.end();
        }

        if(request.url !== '/favicon.ico'){
          if (error) {
            acetate.log.error('server', "error serving %s - %s", request.url, error.message);
          } else {
            acetate.log.success('server', "served %s", request.url);
          }
        }
      });
    }).resume();
  });
}

AcetateServer.prototype.start = function(options) {
  portscanner.findAPortNotInUse(options.port, options.port + MAX_PORTS, options.host, _.bind(function(error, foundPort) {

    // if the found port doesn't match the option port, and we are forced to use the option port
    if (options.port !== foundPort && options.findPort === false) {
      this.acetate.log.error('server', 'port %s is already in use', options.port);
      process.exit(1);
    } else {
      this.server.listen(foundPort);
      this.acetate.log.success('server', 'started at %s:%s', options.host, foundPort);
    }

    if(options.open) {
      this.acetate.log.success('server', 'opening %s:%s', options.host, foundPort);
      opener('http://' + options.host + ':' + foundPort);
    }

  }, this));
};

AcetateServer.prototype.stop = function() {
  this.server.close();
};

module.exports = AcetateServer;