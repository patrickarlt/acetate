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

  this.server = http.createServer(function(request, response){
    request.addListener('end', function() {
      acetate.info('server', 'request recived for %s', request.url);
      files.serve(request, response, function (err, result) {
        if (err) {
          acetate.error('server', "error serving %s - %s", request.url, err.message);
        } else {
          acetate.success('server', "served %s", request.url);
        }
      });
    }).resume();
  });
}

AcetateServer.prototype.start = function(host, port, findPort, open) {
  portscanner.findAPortNotInUse(port, port + MAX_PORTS, host, _.bind(function(error, foundPort) {

    // if the found port doesn't match the option port, and we are forced to use the option port
    if (port !== foundPort && findPort === false) {
      this.acetate.error('server', 'port %s is already in use', port);
      process.exit(1);
    } else {
      this.server.listen(foundPort);
      this.acetate.info('server', 'started at %s:%s', host, foundPort);
    }

    if(open) {
      this.acetate.info('server', 'opening %s:%s', host, foundPort);
      opener('http://' + host + ':' + foundPort);
    }

  }, this));
};

AcetateServer.prototype.stop = function() {
  this.server.close();
};

module.exports = AcetateServer;