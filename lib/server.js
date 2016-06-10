const browserSync = require('browser-sync').create();
const _ = require('lodash');
const createAcetateMiddleare = require('./middleware');
const path = require('path');
const fs = require('fs');
const url = require('url');

const notFoundPageTemplatePath = path.join(__dirname, 'templates', 'not-found.html');
const notFoundPageTemplate = fs.readFileSync(notFoundPageTemplatePath, 'utf8');

function createServer (acetate, options = {}) {
  function notFoundMiddleware (request, response) {
    acetate.warn(`404 not found ${url.parse(request.url).pathname}`);
    response.writeHead(404, {'Content-Type': 'text/html'});
    response.end(notFoundPageTemplate);
  }

  const outputFolder = acetate.outDir;
  const files = path.join(outputFolder, '**/*');
  const plugin = {
    'plugin:name': 'Acetate Browsersync Plugin',
    plugin: function (opts, browserSync) {
      browserSync.addMiddleware('*', acetateMiddleware);
      browserSync.addMiddleware('*', notFoundMiddleware);
    },
    hooks: {
      'client:js': require('fs').readFileSync(path.join(__dirname, 'acetate-client.js'), 'utf8')
    }
  };

  options.logPrefix = 'Acetate';
  options.logLevel = acetate.logLevel;

  // setup server option
  if (options.server && options.server.baseDir) {
    options.server.baseDir = outputFolder;
  }

  if (options.server && Array.isArray(options.server)) {
    options.server.push(outputFolder);
  }

  if (!options.server || (options.server && _.isBoolean(options.server) || _.isString(options.server))) {
    options.server = outputFolder;
  }

  // setup files option
  if (options.files && typeof Array.isArray(options.server)) {
    options.files.push(files);
  }

  if (!options.files || (options.files && typeof options.files === 'string')) {
    options.files = files;
  }

  // setup plugin option
  options.plugins = (options.plugins && options.plugins.length) ? [...options.plugins, plugin] : [plugin];

  // setup snippetOptions
  options.snippetOptions = options.snippetOptions || {};
  options.snippetOptions.async = true;

  const acetateMiddleware = createAcetateMiddleare(acetate);

  acetate.debug('starting server');

  browserSync.init(options, function (error, browserSync) {
    if (error) {
      throw error;
    }
    browserSync.io.sockets.on('connection', function (socket) {
      acetate.debug('Client connected');

      socket.emit('acetate:init');

      socket.on('acetate:client-info', function (e) {
        acetate.debug('Client info %j', e);
        socket.emit('acetate:connected');
        const page = acetateMiddleware.getPageCache()[e.url];
        if (page) {
          acetate.debug('sending page info to client');
          socket.emit('acetate:log', {
            message: 'page data',
            extras: page
          });

          if (page.ignore) {
            socket.emit('acetate:log', {
              message: 'This page is ignored and will not be built.'
            });
          }
        }
      });
    });

    acetate.startWatcher();

    acetate.on('config:reloading', function () {
      browserSync.io.sockets.emit('acetate:log', {
        message: 'Config file changed. Rebuilding configuration.'
      });
    });

    acetate.on('config:error', function (e) {
      browserSync.io.sockets.emit('acetate:fullscreen-message', {
        title: 'Acetate Error',
        message: `${e.error}`,
        extra: e.error.stack
      });

      browserSync.io.sockets.emit('acetate:log', {
        message: `${e.error}`
      });
    });

    acetate.on('config:loaded', function () {
      browserSync.io.sockets.emit('acetate:log', {
        message: 'Configfiguration updated. Reloading.'
      });

      browserSync.publicInstance.reload();
    });

    function watcherHandler (verb) {
      return function (page) {
        browserSync.io.sockets.emit('acetate:log', {
          message: `File ${page.src} ${verb}. Reloading.`
        });

        browserSync.publicInstance.reload();
      };
    }

    acetate.on('watcher:add', watcherHandler('added'));
    acetate.on('watcher:delete', watcherHandler('deleted'));
    acetate.on('watcher:change', watcherHandler('edited'));
    acetate.on('watcher:template:add', watcherHandler('added'));
    acetate.on('watcher:template:delete', watcherHandler('deleted'));
    acetate.on('watcher:template:change', watcherHandler('edited'));
    acetate.on('watcher:error', function (e) {
      browserSync.io.sockets.emit('acetate:fullscreen-message', {
        title: 'Acetate Error',
        message: `${e.error}`,
        extra: e.stack
      });

      browserSync.io.sockets.emit('acetate:log', {
        message: `${e.error}`
      });
    });
  });

  return {
    server: browserSync,
    stop: function stop () {
      acetate.stopWatcher();
      browserSync.cleanup();
    }
  };
}

module.exports = createServer;
