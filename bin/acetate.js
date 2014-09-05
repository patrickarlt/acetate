#!/usr/bin/env node

var path = require('path');
var Acetate = require('../acetate');
var rimraf = require('rimraf');
var static = require('node-static');

var argv = require('yargs')
      .alias('c', 'config')
      .alias('p', 'port')
      .default('port', 3000)
      .default('config', './acetate.conf.js').argv;

function startServer (acetate) {
  var file = new static.Server(path.join(acetate.config.root, acetate.config.dest));
  require('http').createServer(function (request, response) {
    request.addListener('end', function () {
      file.serve(request, response);
    }).resume();
  }).listen(argv.port);
}

function startWatcher (acetate) {
  acetate.startWatcher();
}

function clean (acetate, callback) {
  rimraf(acetate.config.dest ,function(err, out) {
    callback(err, out);
  });
}

function setup (callback) {
  var config = require(path.join(process.cwd(), argv.config));
  Acetate(config.options, function(error, acetate){
    config(acetate);
    callback(error, acetate);
  });
}

function build (acetate) {
  console.time('acetateed in');
  acetate.build(function(error, acetate){
    console.timeEnd('acetateed in');
  });
}

setup(function (error, acetate) {
  var action = argv._[0];
  if(action === 'server'){
    startServer(acetate);
    startWatcher(acetate);
  }
  if(action === 'watch'){
    startWatcher(acetate);
  }
  clean(acetate, function (argument) {
    build(acetate);
  });
});