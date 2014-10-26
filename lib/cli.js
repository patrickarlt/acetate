var path = require('path');
var Acetate = require('./index');

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

function run() {
  var action = argv._[0];
  var acetate = new Acetate(path.join(process.cwd(), argv.config));

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

module.exports = {
  run: run
}