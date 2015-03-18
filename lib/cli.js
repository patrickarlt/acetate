var path = require('path');
var Acetate = require('./index');
var gaze = require('gaze');
var argv = require('yargs')
    .version(function() {
      return 'Acetate '+ require('../package.json').version;
    })
    .usage('Usage: $0 [command] [options]')
    .command('build', 'run a single build of the project and exit')
    .command('watch', 'build site, then watch files for changes and rebuild')
    .command('server', 'build site and watch for changes, serve output folder with built-in server')
    .example('$0 build --clean', 'build site, cleaning the output folder before beginning')
    .help('h')
    .alias('v', 'version')
    .alias('h', 'help')
    .alias('c', 'config')
    .alias('p', 'port')
    .wrap(null)
    .boolean('findPort')
    .boolean('open')
    .boolean('clean')
    .boolean('colorize')
    .default('host', 'localhost')
    .default('port', 8000)
    .default('findPort', false)
    .default('open', false)
    .default('clean', false)
    .default('log', 'info')
    .default('config', 'acetate.conf.js')
    .default('colorize', true)
    .describe('colorize', 'color log output')
    .describe('config', 'path to config file')
    .describe('port', 'port number server should use')
    .describe('host', 'host server should use')
    .describe('findPort', 'find new port if port is in use')
    .describe('open', 'open browser when server starts up')
    .describe('clean', 'clean out files from build folder')
    .describe('log', 'log levels: debug|verbose|info|success|warn|error|stack|silent')
    .argv;

var configPath = path.join(process.cwd(), argv.config);
var action = argv._[0];

function buildCallback(acetate){
  return function(error){
    if(action === 'build' || !action) {
      if (error) {
        console.error(error)
        process.exit(1)
      }
      process.exit(0);
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

  acetate.log.options.level = argv.log;
  acetate.log.options.colorize = argv.colorize;

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