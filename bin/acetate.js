#!/usr/bin/env node

var path = require('path');
var Acetate = require('../acetate');
var static = require('node-static');

var argv = require('yargs')
      .alias('c', 'config')
      .alias('p', 'port')
      .default('port', 3000)
      .default('config', 'acetate.conf.js').argv;

Acetate.init(function(error, acetate){
  var action = argv._[0];

  acetate.loadConfig(argv.config);

  if(action === 'server'){
    var file = new static.Server(path.join(acetate.root, acetate.dest));

    require('http').createServer(function (request, response) {
      request.addListener('end', function () {
        file.serve(request, response);
      }).resume();
    }).listen(argv.port);

    acetate.watcher.start();
  }

  if(action === 'watch'){
    acetate.watcher.start();
  }

  acetate.clean(function(error){
    acetate.build();
  });
});