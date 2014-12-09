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
      .default('log', 'debug')
      .default('config', 'acetate.conf.js').argv;

var configPath = path.join(process.cwd(), argv.config);

function run() {
  var action = argv._[0];
  var acetate = new Acetate(configPath);

  acetate.log = argv.log;

  if(action === 'server'){
    acetate.server.start(argv.host, argv.port, argv.findPort, argv.open);
  }

  if(action === 'watch' || action === 'server'){
    acetate.watcher.start();
  }

  acetate.load(function(){
    if(argv.clean){
      acetate.clean(function(error){
        acetate.build();
      });
    } else {
      acetate.build();
    }
  });
}

if(action === 'watch'){
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