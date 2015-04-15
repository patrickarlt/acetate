var path = require('path');
var acetate = require('../index');
var chokidar = require('chokidar');
var opener = require('opener');

var argv = require('yargs')
    .version(function () {
      return 'Acetate ' + require('../package.json').version;
    })
    .demand(1, 'Command not found, re-run with one of the valid commands')
    .usage('Usage: $0 [command] [options]')
    .command('build', 'run a single build of the project and exit')
    .command('watch', 'build site, then watch files for changes and rebuild')
    .command('server', 'build site and watch for changes, serve output folder with built-in server')
    .example('$0 server --open', 'build site, start development server and open site')
    .help('h')
    .alias('v', 'version')
    .alias('h', 'help')
    .alias('c', 'config')
    .alias('p', 'port')
    .wrap(null)
    .boolean('findPort')
    .boolean('open')
    .default('host', 'localhost')
    .default('port', 8000)
    .default('findPort', false)
    .default('open', false)
    .default('log', 'info')
    .default('config', 'acetate.conf.js')
    .describe('config', 'path to config file')
    .describe('port', 'port number server should use')
    .describe('host', 'host server should use')
    .describe('findPort', 'find new port if port is in use')
    .describe('open', 'open browser when server starts up')
    .describe('log', 'log levels: debug|verbose|info|success|warn|error|stack|silent')
    .check(function (argv) {
      var valid = (/build|server|watch/).test(argv._[0]);

      if (!valid) {
        throw new Error('invalid command "' + argv._[0] + '" - try using build, watch or server');
      }

      return valid;
    })
    .argv;

var action = argv._[0];
var options = {
  config: argv.config,
  root: process.cwd(),
  watcher: action !== 'build', // start watcher if action IS NOT build
  server: action === 'server', // start server if action is server
  host: argv.host,
  port: argv.port,
  findPort: argv.findPort,
  open: argv.open,
  log: argv.log,
  args: argv
};

function run () {
  var site = acetate(options);

  // if building exit the process once we are done
  if (action === 'build') {
    site.once('build', function (e) {
      process.exit((e.status === 'success') ? 0 : 1);
    });
  }

  // if serving open the site once we are done building
  if (action === 'server') {
    site.once('server:start', function (e) {
      site.log.success('server', 'opening %s:%s', e.host, e.port);
      opener('http://' + e.host + ':' + e.port);
    });
  }

  // if watching or serving watch the config file and rebuild the whole site
  if (action !== 'build') {
    chokidar.watch(path.join(process.cwd(), argv.config), {
      ignoreInitial: true
    }).on('change', function () {
      site.log.success('watcher', 'config file changed, rebuilding site');
      site.watcher.stop();
      site.server.stop();
      site = acetate(options);
    });
  }
}

module.exports = {
  run: run
};
