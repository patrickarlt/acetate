#!/usr/bin/env node

// watch
// serve
// build

var path = require('path');
var Press = require('../press');
var rimraf = require('rimraf');
var static = require('node-static');

var argv = require('yargs')
      .alias('c', 'config')
      .alias('p', 'port')
      .default('port', 3000)
      .default('config', './press.conf.js').argv;

function startServer (press) {
  var file = new static.Server(path.join(press.config.root, press.config.dest));
  require('http').createServer(function (request, response) {
      request.addListener('end', function () {
          file.serve(request, response);
      }).resume();
  }).listen(argv.port);
}

function startWatcher (press) {
  press.startWatcher();
}

function clean (press, callback) {
  rimraf(press.config.dest ,function(err, out) {
    callback(err, out);
  });
}

function setup (callback) {
  Press({}, function(error, press){
    require(path.join(process.cwd(), argv.config))(press);
    callback(error, press);
  });
}

function build (press) {
  console.time('pressed in');
  press.build(function(error, press){
    console.timeEnd('pressed in');
  });
}

setup(function (error, press) {
  var action = argv._[0];
  if(action === 'server'){
    startServer(press);
    startWatcher(press);
  }
  if(action === 'watch'){
    startWatcher(press);
  }
  clean(press, function (argument) {
    build(press);
  });
});