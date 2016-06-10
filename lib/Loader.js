const async = require('async');
const glob = require('glob');
const path = require('path');
const chokidar = require('chokidar');
const EventEmitter = require('events');
const createPage = require('./createPage');
const Logger = require('./Logger');
const _ = require('lodash');

class Loader {
  constructor ({
    sourceDir = path.join(process.cwd(), 'src'),
    emitter = new EventEmitter(),
    logger,
    logLevel = 'info'
  } = {}) {
    this.reset();
    this.emitter = emitter;
    this.sourceDir = sourceDir;
    this.logger = logger || new Logger({level: logLevel});
  }

  load (pattern) {
    this._paths.push(pattern);

    if (this._watcher) {
      this._watcher.add(pattern);
    }

    this._loaders.push(this._createLoaderTask(pattern));
  }

  getPages () {
    if (this._loaded) {
      return Promise.resolve(this._pages);
    }

    return this.loadPages();
  }

  loadPages () {
    return new Promise((resolve, reject) => {
      const iterator = (pages, loader, callback) => {
        loader(pages, function (error, newPages) {
          if (error) {
            callback(error);
            return;
          }

          callback(error, pages.concat(newPages));
        });
      };

      const done = (error, pages) => {
        if (error) {
          reject(error);
          return;
        }

        this._loaded = true;
        this._pages = pages;

        resolve(this._pages);
      };

      async.reduce(this._loaders, [], iterator, done);
    });
  }

  _createLoaderTask (pattern) {
    return (pages, callback) => {
      var _timer = this.logger.time();

      const done = (error, filepaths) => {
        if (error) {
          callback(error);
        }

        const pages = _(filepaths)
          .filter((filepath) => {
            return path.basename(filepath)[0] !== '_';
          })
          .map((src) => {
            return createPage.fromTemplate(src, path.join(this.sourceDir, src));
          })
          .value();

        Promise.all(pages)
          .then((pages) => {
            this.logger.info(`Loaded ${pages.length} pages in ${this.logger.timeEnd(_timer)}`);
            callback(null, pages);
          })
          .catch((error) => {
            this.logger.error(error);
            callback(error, []);
          });
      };

      glob(pattern, {
        cwd: this.sourceDir,
        nodir: true
      }, done);
    };
  }

  reset () {
    this._paths = [];
    this._pages = [];
    this._loaded = false;
    this._loaders = [];
  }

  startWatcher () {
    this._watcher = chokidar.watch(this._paths, {
      cwd: this.sourceDir,
      ignoreInitial: true
    });

    this._watcher.on('ready', () => {
      this.logger.debug('File watcher ready');
      this.emitter.emit('watcher:ready');
    });

    this._watcher.on('add', (src) => {
      if (path.basename(src)[0] === '_') {
        this.emitter.emit('watcher:template:add', src);
      } else {
        createPage.fromTemplate(src, path.join(this.sourceDir, src))
          .then(page => {
            this._pages.push(page);
            this.logger.info(`${src} added`);
            this.emitter.emit('watcher:add', page);
          })
          .catch(this._handleWatcherError.bind(this));
      }
    });

    this._watcher.on('change', (src) => {
      if (path.basename(src)[0] === '_') {
        this.emitter.emit('watcher:template:change', src);
      } else {
        this._pages = this._pages.filter((page) => page.src !== src);
        createPage.fromTemplate(src, path.join(this.sourceDir, src))
          .then(page => {
            this._pages.push(page);
            this.logger.info(`${src} changed`);
            this.emitter.emit('watcher:change', page);
          })
          .catch(this._handleWatcherError.bind(this));
      }
    });

    this._watcher.on('unlink', (src) => {
      if (path.basename(src)[0] === '_') {
        this.emitter.emit('watcher:template:delete', src);
      } else {
        const [ removedPage ] = _.remove(this._pages, (page) => page.src === src);
        if (removedPage) {
          this.logger.info(`${src} deleted`);
          this.emitter.emit('watcher:delete', removedPage);
        }
      }
    });
  }

  stopWatcher () {
    this._watcher.close();
    this._watcher = null;
  }

  _handleWatcherError (error) {
    this._loaded = false;
    this._pages = [];
    this.logger.error(error);
    this.emitter.emit('watcher:error', {
      error
    });
  }
}

module.exports = Loader;