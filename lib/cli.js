var path = require('path');
var Acetate = require('./index');
var gaze = require('gaze');

var argv = require('yargs')
      .alias('c', 'config')
      .alias('p', 'port')
      .default('host', 'localhost')
      .default('port', 8000)
      .default('findPort', false)
      .default('open', false)
      .default('clean', false)
      .default('log', 'info')
      .default('config', 'acetate.conf.js').argv;

var configPath = path.join(process.cwd(), argv.config);
var action = argv._[0];

function buildCallback(acetate){
  return function(error){
    if(action === 'build') {
      process.exit(!error);
    }

    if(action === 'server'){
      acetate.server.start(argv.host, argv.port, argv.findPort, argv.open);
    }

    if(action === 'watch' || action === 'server'){
      acetate.watcher.start();
    }
  }
}

function run() {
  var acetate = new Acetate(configPath);

  acetate.log.level = argv.log;

  acetate.log.time('start');
  acetate.log.time('load');

  acetate.load(function(){
    acetate.log.verbose('load', 'loading pages done in %s', acetate.log.timeEnd('load'));

    if(argv.clean){
      acetate.log.time('clean');
      acetate.clean(function(error){
        acetate.log.verbose('cleaning', 'cleaning build folder done in %s', acetate.log.timeEnd('clean'));
        acetate.build(buildCallback(acetate));
      });
    } else {
      acetate.build(buildCallback(acetate));
    }
  });
}

if(action === 'watch' || action === 'server'){
  // watch the passed config file
  gaze(argv.config, function(error, watcher){

    // whenever it chagnes
    watcher.on('changed', function() {

      // stop the server if we were running it
      if(action === 'server'){
        acetate.server.stop();
      }

      // stop the watcher if we were running it
      if(action === 'watch' || action === 'server'){
        acetate.watcher.stop();
      }

      // rerun everything
      run();

    });
  });
}

module.exports = {
  run: run
};