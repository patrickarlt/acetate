var acetate = require('../index');

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
    .example('$0 watcher -o dist', 'build site to `dist` folder, start watching for changes')
    .example('$0 build --log=verbose', 'build site with extra logging')
    .help('h')
    .alias('v', 'version')
    .alias('h', 'help')
    .alias('c', 'config')
    .alias('p', 'port')
    .alias('i', 'input')
    .alias('o', 'output')
    .wrap(null)
    .boolean('open')
    .default('host', 'localhost')
    .default('port', 8000)
    .default('findPort', false)
    .default('open', false)
    .default('https', false)
    .default('log', 'info')
    .default('input', 'src')
    .default('output', 'build')
    .default('config', 'acetate.conf.js')
    .describe('config', 'path to config file')
    .describe('port', 'port number server should use')
    .describe('host', 'host server should use')
    .describe('open', 'open browser when server starts up')
    .describe('log', 'log levels: debug|verbose|info|success|warn|error|silent')
    .describe('input', 'source folder to read pages from')
    .describe('output', 'folder where pages will be built')
    .describe('https', 'enable https on the dev server')
    .check(function (argv) {
      var valid = (/build|server|watch/).test(argv._[0]);

      if (!valid) {
        throw new Error('invalid command "' + argv._[0] + '" - try using "build", "watch" or "server"');
      }

      return valid;
    })
    .argv;

var action = argv._.shift();

var options = {
  mode: action,
  config: argv.config,
  root: process.cwd(),
  src: argv.input,
  dest: argv.output,
  host: argv.host,
  port: argv.port,
  open: argv.open,
  log: argv.log,
  args: argv,
  https: argv.https
};

function run () {
  var site = acetate(options);

  site.once('ready', function () {
    site.src = argv.input;
    site.dest = argv.output;
    site.load();
  });

  if (action === 'build') {
    site.once('build', function (e) {
      process.exit((e.status === 'success') ? 0 : 1);
    });
  }
}

module.exports = {
  run: run
};
