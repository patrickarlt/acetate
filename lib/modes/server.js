const browserSync = require("browser-sync").create();
const _ = require("lodash");
const createAcetateMiddleare = require("./middleware");
const path = require("path");
const fs = require("fs");
const url = require("url");

const notFoundPageTemplatePath = path.join(
  __dirname,
  "../",
  "templates",
  "not-found.html"
);
const notFoundPageTemplate = fs.readFileSync(notFoundPageTemplatePath, "utf8");

function createServer(acetate, options = {}) {
  function notFoundMiddleware(request, response) {
    acetate.log.warn(`404 not found ${url.parse(request.url).pathname}`);
    response.writeHead(404, { "Content-Type": "text/html" });
    response.end(notFoundPageTemplate);
  }

  const outputFolder = acetate.outDir;
  const files = path.join(outputFolder, "**/*");
  const plugin = {
    "plugin:name": "Acetate Browsersync Plugin",
    plugin: function(opts, browserSync) {
      browserSync.addMiddleware("*", acetateMiddleware);
      browserSync.addMiddleware("*", notFoundMiddleware);
    },
    hooks: {
      "client:js": require("fs").readFileSync(
        path.join(__dirname, "../", "support", "client.js"),
        "utf8"
      )
    }
  };

  options.logPrefix = "Acetate";
  options.logLevel = acetate.logLevel;

  // setup server option
  if (options.server && options.server.baseDir) {
    options.server.baseDir = outputFolder;
  }

  if (options.server && Array.isArray(options.server)) {
    options.server.push(outputFolder);
  }

  if (
    !options.server ||
    ((options.server && _.isBoolean(options.server)) ||
      _.isString(options.server))
  ) {
    options.server = outputFolder;
  }

  // setup files option
  if (options.files && typeof Array.isArray(options.server)) {
    options.files.push(files);
  }

  if (!options.files || (options.files && typeof options.files === "string")) {
    options.files = files;
  }

  // setup plugin option
  options.plugins =
    options.plugins && options.plugins.length
      ? [...options.plugins, plugin]
      : [plugin];

  // setup snippetOptions
  options.snippetOptions = options.snippetOptions || {};
  options.snippetOptions.async = true;

  const acetateMiddleware = createAcetateMiddleare(acetate);

  acetate.log.debug("starting server");

  browserSync.init(options, function(error, bs) {
    if (error) {
      throw error;
    }

    browserSync.sockets.on("connection", function(socket) {
      acetate.log.debug("Client connected");

      socket.emit("acetate:init");

      socket.on("acetate:client-info", function(e) {
        acetate.log.debug("Client info %j", e);
        socket.emit("acetate:connected");

        const page = acetateMiddleware.getPageCache()[e.url];

        if (page) {
          acetate.log.debug("sending page info to client");
          socket.emit("acetate:log", {
            message: "page data",
            extras: page
          });

          if (page.ignore) {
            socket.emit("acetate:log", {
              message: "This page is ignored and will not be built."
            });
          }
        }
      });
    });

    acetate.startWatcher();

    acetate.on("config:reloading", function() {
      browserSync.sockets.emit("acetate:log", {
        message: "Config file changed. Rebuilding configuration."
      });
    });

    acetate.on("config:error", function(e) {
      browserSync.sockets.emit("acetate:fullscreen-message", {
        title: "Acetate Error",
        message: `${e.error.name}: ${e.error.message}`,
        extra: e.error.stack
      });

      browserSync.sockets.emit("acetate:log", {
        message: `${e.error.name}: ${e.error.message}`
      });
    });

    acetate.on("config:loaded", function() {
      browserSync.sockets.emit("acetate:log", {
        message: "Configfiguration updated. Reloading."
      });

      browserSync.reload();
    });

    function pageEventHandler(verb) {
      return function(page) {
        logAndReload(`Page ${page.src} ${verb}. Reloading.`);
      };
    }

    function templateEventHandler(verb) {
      return function(src) {
        acetate.invalidateTemplate(src);
        logAndReload(`Template ${src} ${verb}. Reloading.`);
      };
    }

    function logAndReload(message) {
      browserSync.sockets.emit("acetate:log", {
        message
      });

      browserSync.reload();
    }

    acetate.on("watcher:add", pageEventHandler("added"));
    acetate.on("watcher:delete", pageEventHandler("deleted"));
    acetate.on("watcher:change", pageEventHandler("edited"));
    acetate.on("watcher:template:add", templateEventHandler("added"));
    acetate.on("watcher:template:delete", templateEventHandler("deleted"));
    acetate.on("watcher:template:change", templateEventHandler("edited"));

    function handleError(e) {
      browserSync.sockets.emit("acetate:fullscreen-message", {
        title: "Acetate Error",
        message: `${e.error.name}: ${e.error.message}`,
        extra: e.stack
      });

      browserSync.sockets.emit("acetate:log", {
        message: `${e.error}`
      });
    }

    acetate.on("renderer:error", handleError);
    acetate.on("watcher:error", handleError);
  });

  return {
    browserSync,
    reload: function reload() {
      browserSync.reload();
    },
    sendLog: function sendLog(message, ...extras) {
      browserSync.sockets.emit("acetate:log", {
        message,
        extras
      });
    },
    sendFullscreenMessage: function sendFullscreenMessage(
      title,
      message,
      extra
    ) {
      browserSync.sockets.emit("acetate:fullscreen-message", {
        title,
        message,
        extra
      });
    },
    stop: function stop() {
      acetate.stopWatcher();
      browserSync.cleanup();
    }
  };
}

module.exports = createServer;
