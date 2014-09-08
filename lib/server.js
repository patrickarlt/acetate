var static = require('node-static');
var http = require('http');
var path = require('path');

function AcetateServer(acetate){
  var files = new static.Server(path.join(process.cwd(), acetate.options.dest));
  this.server = http.createServer(function(request, response){
    request.addListener('end', function () {
      files.serve(request, response);
    }).resume();
  });
}

AcetateServer.prototype.start = function(port) {
  this.server.listen(port);
};

AcetateServer.prototype.stop = function() {
  this.server.close();
};

module.exports = AcetateServer;