const path = require("path");
const Acetate = require("./Acetate.js");
const server = require("./modes/server.js");
const watcher = require("./modes/watcher.js");
const builder = require("./modes/builder.js");

const argv = require("yargs")
  .version(function() {
    return "Acetate " + require("../package.json").version;
  })
  .demand(1, "Command not found, re-run with one of the valid commands")
  .usage("Usage: $0 [command] [options]")
  .command("build", "run a single build of the project and exit")
  .command("watch", "build site, then watch files for changes and rebuild")
  .command(
    "server",
    "build site and watch for changes, serve output folder with built-in server"
  )
  .example(
    "$0 server --open",
    "build site, start development server and open site"
  )
  .example(
    "$0 watcher -o dist",
    "build site to `dist` folder, start watching for changes"
  )
  .example("$0 build --log=verbose", "build site with extra logging")
  .showHelpOnFail(false, "Specify --help for available options")
  .help("h")
  .alias("h", "help")
  .alias("v", "version")
  .wrap(null)
  // require option
  .array("require")
  .describe(
    "require",
    "require additional modules before starting Acetate (babel-register)"
  )
  .alias("r", "require")
  // open option
  .default("open", false)
  .describe("open", "open browser after server starts up (server only)")
  // host option
  .default("host", "localhost")
  .describe("host", "host server should use (server only)")
  // port option
  .default("port", 8000)
  .describe("port", "port number server should use (server only)")
  .alias("p", "port")
  // findPort option
  .boolean("findPort")
  .default("findPort", false)
  .describe(
    "findPort",
    "if true the server will find a port automatically (server only)"
  )
  // https option
  .boolean("https")
  .default("https", false)
  .describe(
    "https",
    "enable https on the dev server with built-in Browsersync certs"
  )
  // log option
  .default("log", "debug")
  .describe("log", "log levels: debug|info|warn|silent")
  // input option
  .option("input", {
    alias: "i",
    describe: "source folder to read pages from",
    default: "src",
    global: true
  })
  // output option
  .option("output", {
    alias: "o",
    describe: "folder where pages will be built",
    default: "build",
    global: true
  })
  // config file option
  .option("config", {
    alias: "c",
    describe: "path to config file",
    default: "acetate.config.js",
    global: true,
    normalize: true
  })
  // http-cert option
  .describe(
    "https-cert",
    "enable https on the dev server with Browsersync certs"
  )
  // http-key option
  .describe(
    "https-key",
    "enable https on the dev server with Browsersync certs"
  ).argv;

const action = argv._.shift();
let https;

if (argv.https) {
  https = argv.https;
}

if (argv.httpsCert && argv.httpsKey) {
  https = {
    key: path.resolve(process.cwd(), argv.httpsKey),
    cert: path.resolve(process.cwd(), argv.httpsCert)
  };
}

function run() {
  if (argv.require && argv.require.length) {
    argv.require.forEach(dep => {
      require(dep);
    });
  }

  const root = path.dirname(path.resolve(argv.config));
  const configPath = path.join(process.cwd(), argv.config);
  const relativeConfig = path.relative(root, configPath);

  const acetate = new Acetate({
    config: relativeConfig,
    sourceDir: argv.input,
    outDir: argv.output,
    root: root,
    log: argv.log,
    args: argv
  });

  switch (action) {
    case "server":
      server(acetate, {
        https
      });
      break;

    case "watch":
      watcher(acetate);
      break;

    case "build":
      builder(acetate);
      break;
  }
}

module.exports = {
  run: run
};
