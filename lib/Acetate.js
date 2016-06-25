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
    log = 'info',
    args = {}
  } = {}) {
    this.args = args;
    this.root = root;
    this.config = config;
    this.src = sourceDir;
    this.dest = outDir;
    this.sourceDir = path.join(root, sourceDir);
    this.outDir = path.join(root, outDir);
    this._configPaths = [];
    this._loaded = false;
    this.emitter = new EventEmitter();

    this.logger = new Logger({
      emitter: this.emitter,
      level: log
    });

    this.loader = new Loader({
      sourceDir: this.sourceDir,
      emitter: this.emitter,
      logger: this.logger
    });

    this.transformer = new Transformer({
      sourceDir: this.sourceDir,
      logger: this.logger
    });

    this.renderer = new Renderer({
      sourceDir: this.sourceDir,
      emitter: this.emitter,
      logger: this.logger
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

  query () {
    return this.transformer.query.apply(this.transformer, arguments);
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

  global () {
    return this.renderer.global.apply(this.renderer, arguments);
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

    // require our new configuration
    this.use(require(fullPath));
  }

  use (plugin) {
    plugin(this);
  }

  addListener () {
    return this.emitter.addListener.apply(this.emitter, arguments);
  }

  emit () {
    return this.emitter.emit.apply(this.emitter, arguments);
  }

  eventNames () {
    return this.emitter.eventNames.apply(this.emitter, arguments);
  }

  getMaxListeners () {
    return this.emitter.getMaxListeners.apply(this.emitter, arguments);
  }

  listenerCount () {
    return this.emitter.listenerCount.apply(this.emitter, arguments);
  }

  listeners () {
    return this.emitter.listeners.apply(this.emitter, arguments);
  }

  on () {
    return this.emitter.on.apply(this.emitter, arguments);
  }

  once () {
    return this.emitter.once.apply(this.emitter, arguments);
  }

  prependListener () {
    return this.emitter.prependListener.apply(this.emitter, arguments);
  }

  prependOnceListener () {
    return this.emitter.prependOnceListener.apply(this.emitter, arguments);
  }

  removeAllListeners () {
    return this.emitter.removeAllListeners.apply(this.emitter, arguments);
  }

  removeListener () {
    return this.emitter.removeListener.apply(this.emitter, arguments);
  }

  setMaxListeners () {
    return this.emitter.setMaxListeners.apply(this.emitter, arguments);
  }

  init () {
    this.info('Loading config file.');
    this.reload();
  }

  reload () {
    this.emitter.emit('config:reloading');
    this.loader.reset();
    this.transformer.reset();
    this.renderer.reset();

    this.require('./helpers/highlight-block.js');
    this.require('./helpers/link-helper.js');
    this.require('./helpers/markdown-block.js');

    try {
      // require new configs
      this.require(path.resolve(this.root, this.config));

      this.emitter.emit('config:loaded');
      this._loaded = true;
    } catch (e) {
      const error = new AcetateConfigError(e, this.root);
      if (this._loaded) {
        this.error(error);
        this.emitter.emit('config:error', {
          error
        });
        return;
      }

      throw e;
    }

    this.require('./transformers/stats.js');
  }

  log () {
    return this.logger.log.apply(this.logger, arguments);
  }

  debug () {
    return this.logger.debug.apply(this.logger, arguments);
  }

  info () {
    return this.logger.info.apply(this.logger, arguments);
  }

  success () {
    return this.logger.success.apply(this.logger, arguments);
  }

  warn () {
    return this.logger.warn.apply(this.logger, arguments);
  }

  error () {
    return this.logger.error.apply(this.logger, arguments);
  }

  time () {
    return this.logger.time.apply(this.logger, arguments);
  }

  timeEnd () {
    return this.logger.timeEnd.apply(this.logger, arguments);
  }

  startWatcher () {
    if (this._watcher) {
      this.stopWatcher();
    }

    this._watcher = chokidar.watch(this._configPaths);

    this._watcher.on('ready', () => {
      this.emitter.emit('config:watcher:ready');
    });

    this._watcher.on('change', () => {
      setTimeout(() => {
        this.info('Config file changed. Rebuilding configuration.');
        this.reload();
      }, 100);
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
}

module.exports = Acetate;
