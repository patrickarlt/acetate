const Loader = require('./Loader');
const Transformer = require('./Transformer');
const Renderer = require('./Renderer');
const EventEmitter = require('events');
const chokidar = require('chokidar');
const path = require('path');
const AcetateConfigError = require('./error-types/AcetateConfigError.js');
const Logger = require('./Logger.js');

class Acetate {
  constructor ({
    config = 'acetate.config.js',
    sourceDir = 'src',
    outDir = 'build',
    root = process.cwd(),
    logLevel = 'info'
  } = {}) {
    this.root = root;
    this.config = config;
    this.sourceDir = path.join(root, sourceDir);
    this.outDir = path.join(root, outDir);
    this.logLevel = logLevel;
    this._configPaths = [];
    this._loaded = false;
    this._emitter = new EventEmitter();

    this._logger = new Logger({
      emitter: this._emitter,
      level: this.logLevel
    });

    this.loader = new Loader({
      sourceDir: this.sourceDir,
      emitter: this._emitter,
      logger: this._logger
    });

    this.transformer = new Transformer({
      sourceDir: this.sourceDir,
      logger: this._logger
    });

    this.renderer = new Renderer({
      sourceDir: this.sourceDir,
      logger: this._logger
    });

    this.init();
  }

  data () {
    return this.transformer.data.apply(this.transformer, arguments);
  }

  layout () {
    return this.transformer.layout.apply(this.transformer, arguments);
  }

  ignore () {
    return this.transformer.ignore.apply(this.transformer, arguments);
  }

  metadata () {
    return this.transformer.metadata.apply(this.transformer, arguments);
  }

  transform () {
    return this.transformer.transform.apply(this.transformer, arguments);
  }

  transformAll () {
    return this.transformer.transformAll.apply(this.transformer, arguments);
  }

  transformAsync () {
    return this.transformer.transformAsync.apply(this.transformer, arguments);
  }

  transformAllAsync () {
    return this.transformer.transformAllAsync.apply(this.transformer, arguments);
  }

  generate () {
    return this.transformer.generate.apply(this.transformer, arguments);
  }

  load () {
    return this.loader.load.apply(this.loader, arguments);
  }

  prerender () {
    return this.renderer.prerender.apply(this.renderer, arguments);
  }

  helper () {
    return this.renderer.helper.apply(this.renderer, arguments);
  }

  block () {
    return this.renderer.block.apply(this.renderer, arguments);
  }

  filter () {
    return this.renderer.filter.apply(this.renderer, arguments);
  }

  require (configPath) {
    var fullPath;

    // resolve this path to node_modules or locally
    try {
      fullPath = require.resolve(configPath);
    } catch (e) {
      fullPath = path.resolve(this.root, configPath);
    }

    // add this path to the cache of config paths
    this._configPaths.push(fullPath);

    // make sure our new module isn't cached
    delete require.cache[fullPath];

    // figure out if the watcher is running
    const isWatching = this.watching;

    // stop the watcher if it is running
    if (isWatching) {
      this.stopWatcher();
    }

    // require our new configuration
    require(fullPath)(this);

    // restart the watcher
    if (isWatching) {
      this.startWatcher();
    }
  }

  addListener () {
    return this._emitter.addListener.apply(this._emitter, arguments);
  }

  emit () {
    return this._emitter.emit.apply(this._emitter, arguments);
  }

  eventNames () {
    return this._emitter.eventNames.apply(this._emitter, arguments);
  }

  getMaxListeners () {
    return this._emitter.getMaxListeners.apply(this._emitter, arguments);
  }

  listenerCount () {
    return this._emitter.listenerCount.apply(this._emitter, arguments);
  }

  listeners () {
    return this._emitter.listeners.apply(this._emitter, arguments);
  }

  on () {
    return this._emitter.on.apply(this._emitter, arguments);
  }

  once () {
    return this._emitter.once.apply(this._emitter, arguments);
  }

  prependListener () {
    return this._emitter.prependListener.apply(this._emitter, arguments);
  }

  prependOnceListener () {
    return this._emitter.prependOnceListener.apply(this._emitter, arguments);
  }

  removeAllListeners () {
    return this._emitter.removeAllListeners.apply(this._emitter, arguments);
  }

  removeListener () {
    return this._emitter.removeListener.apply(this._emitter, arguments);
  }

  setMaxListeners () {
    return this._emitter.setMaxListeners.apply(this._emitter, arguments);
  }

  init () {
    this.info('Loading config file.');
    this.reload();
  }

  reload () {
    this._emitter.emit('config:reloading');
    this.loader.reset();
    this.transformer.reset();
    this.renderer.reset();

    this.require('./helpers/highlight-block.js');
    this.require('./helpers/link-helper.js');
    this.require('./helpers/markdown-block.js');

    try {
      this.require(path.resolve(this.root, this.config));
      this._emitter.emit('config:loaded');
      this._loaded = true;
    } catch (e) {
      const error = new AcetateConfigError(e, this.root);
      if (this._loaded) {
        this.error(error);
        this._emitter.emit('config:error', {
          error
        });
        return;
      }

      throw e;
    }

    this.require('./transformers/stats.js');
  }

  log () {
    return this._logger.log.apply(this._logger, arguments);
  }

  debug () {
    return this._logger.debug.apply(this._logger, arguments);
  }

  info () {
    return this._logger.info.apply(this._logger, arguments);
  }

  success () {
    return this._logger.success.apply(this._logger, arguments);
  }

  warn () {
    return this._logger.warn.apply(this._logger, arguments);
  }

  error () {
    return this._logger.error.apply(this._logger, arguments);
  }

  time () {
    return this._logger.time.apply(this._logger, arguments);
  }

  timeEnd () {
    return this._logger.timeEnd.apply(this._logger, arguments);
  }

  startWatcher () {
    this._watcher = chokidar.watch(this._configPaths);
    this._watcher.on('ready', () => {
      this._emitter.emit('config:watcher:ready');
    });
    this._watcher.on('change', () => {
      this.info('Config file changed. Rebuilding configuration.');
      this.reload();
    });
    this.debug('Starting watcher.');
    this.loader.startWatcher();
  }

  stopWatcher () {
    this.loader.stopWatcher();
    this._watcher.unwatch(this._configPaths);
    this._watcher.close();
    this.watcher = null;
  }

  get watching () {
    return !!this.watcher;
  }
}

module.exports = Acetate;
