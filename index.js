var acetate = require('./lib/site');
var browserSync = require('browser-sync');
var _ = require('lodash');
var chokidar = require('chokidar');
var path = require('path');
var url = require('url');

module.exports = function (options, callback) {
  options = _.defaults(options, {
    mode: 'build',
    config: 'acetate.conf.js',
    src: 'src',
    dest: 'build',
    root: process.cwd(),
    log: 'info',
    host: 'localhost',
    port: 8000,
    https: false,
    server: {},
    args: {}
  });

  var site = acetate(options);
  var index;
  var server;
  var fileWatcher;
  var configWatcher;

  function action () {
    if (options.mode === 'server') {
      reload();
    }

    if (options.mode === 'watch') {
      site.build();
    }
  }

  function buildIndex (callback) {
    site.debug('server', 'rebuilding page index');
    site.runExtensions(function () {
      index = _.indexBy(site.pages, function (page) {
        return (page.url[0] !== '/') ? '/' + page.url : page.url;
      });

      if (callback) {
        callback();
      }
    });
  }

  function pageBuilder (request, response, next) {
    site.verbose('server', 'request recived for %s', request.url);

    if (request.method !== 'GET') {
      next();
      return;
    }

    var pathname = url.parse(request.url).pathname;
    var ext = path.extname(pathname);

    if (!ext && pathname[pathname.length - 1] !== '/') {
      pathname = pathname + '/';
    }

    if (index[pathname] && index[pathname].dirty) {
      index[pathname].build(function () {
        next();
      });
    } else {
      next();
    }
  }

  function startServer () {
    site.info('server', 'starting server');

    buildIndex(function () {
      server = browserSync.create();

      server.emitter.on('init', function () {
        site.emit('server:ready');
      });

      var serverOptions = _.clone(site.options.server);

      delete serverOptions.proxy;
      serverOptions.logLevel = (options.log === 'debug' || options.log === 'silent') ? options.log : 'info';
      serverOptions.server = path.join(site.dest);
      serverOptions.files = path.join(site.dest, '**/*');
      serverOptions.port = serverOptions.port || options.port;
      serverOptions.host = serverOptions.host || options.host;
      serverOptions.open = serverOptions.open || options.open;
      serverOptions.https = serverOptions.https || options.https;
      serverOptions.logPrefix = 'Acetate';
      serverOptions.middleware = serverOptions.middleware || [];
      serverOptions.middleware.push(pageBuilder);

      server.init(serverOptions);
      site.emit('server:start');
    });
  }

  function startConfigWatcher () {
    configWatcher = chokidar.watch(site.config, {
      ignoreInitial: true
    }).on('change', function () {
      site.success('watcher', 'config file changed, restarting Acetate');
      var newSite = acetate(options);
      _.extend(site, {
        reload: reload,
        cleanup: cleanup
      });
      site.emit('restart', newSite);
      site = newSite;
      site.once('load', function () {
        action();
      });
    });
  }

  function startFileWatcher () {
    fileWatcher = chokidar.watch(site.sources, {
      ignoreInitial: true
    });

    fileWatcher.on('change', changed);
    fileWatcher.on('add', added);
    fileWatcher.on('unlink', deleted);
    fileWatcher.on('ready', function () {
      site.emit('watcher:ready');
    });

    site.emit('watcher:start');
  }

  function reload () {
    buildIndex(function () {
      site.info('server', 'refreshing pages');
      server.reload(_(site.pages).collect('dirty').collect('url').value());
    });
  }

  function changed (filepath) {
    site.info('watcher', '%s changed', filepath.replace(process.cwd() + path.sep, ''));
    invalidateNunjucksCache(filepath);
    removeOldPage(filepath);
    loadNewPage(filepath);
  }

  function deleted (filepath) {
    site.info('watcher', '%s deleted', filepath.replace(process.cwd() + path.sep, ''));
    invalidateNunjucksCache(filepath);
    removeOldPage(filepath);
  }

  function added (filepath) {
    site.info('watcher', '%s added', filepath.replace(process.cwd() + path.sep, ''));
    loadNewPage(filepath);
  }

  function removeOldPage (filepath) {
    var page = _.remove(site.pages, {fullpath: filepath})[0];

    if (page) {
      site.verbose('watcher', 'removing %s', page.dest);
      page.clean();
    }
  }

  function loadNewPage (filepath) {
    var relativepath = filepath.replace(process.cwd() + path.sep, '');
    if (path.basename(filepath)[0] === '_') {
      invalidateNunjucksCache(filepath);
      _.each(site.pages, function (page) {
        page.dirty = true;
      });
      action();
    } else {
      site.loadPage(filepath, function (error, page) {
        if (error) {
          site('watcher', 'error loading %s - %s', error);
          return;
        }

        site.info('watcher', 'rebuilding %s', relativepath);
        site.pages.push(page);
        action();
      });
    }
  }

  function invalidateNunjucksCache (filepath) {
    var name = filepath.replace(site.src + path.sep, '').replace(path.extname(filepath), '');
    site.debug('nunjucks', 'clearing %s from the template cache', name);
    site.nunjucks.loaders[0].emit('update', name);
  }

  function cleanup (callback) {
    if (fileWatcher) {
      fileWatcher.close();
    }

    if (configWatcher) {
      configWatcher.close();
    }

    if (server) {
      server.cleanup();
    }
  }

  if (options.mode === 'server' || options.mode === 'watch') {
    process.once('SIGINT', cleanup);
  }

  site.once('load', function () {
    if (options.mode === 'build') {
      site.build(callback);
    }

    if (options.mode === 'server') {
      startFileWatcher();
      startConfigWatcher();
      startServer();
    }

    if (options.mode === 'watch') {
      site.build(function () {
        startFileWatcher();
        startConfigWatcher();
      });
    }
  });

  _.extend(site, {
    reload: reload,
    cleanup: cleanup
  });

  site.once('ready', function () {
    site.load();
  });

  return site;
};
