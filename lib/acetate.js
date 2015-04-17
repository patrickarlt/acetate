var _ = require('lodash');
var async = require('async');
var path = require('path');
var util = require('util');
var events = require('events');

var watcher = require('./components/watcher');
var server = require('./components/server');
var logger = require('./components/logger');
var loader = require('./components/loader');
var builder = require('./components/builder');
var markdown = require('./components/markdown');
var nunjucks = require('./components/nunjucks');

var markdownHelpers = require('./extensions/markdown-helpers');
var metadataInjector = require('./extensions/metadata');
var query = require('./extensions/query');
var transform = require('./extensions/transform');
var globalData = require('./extensions/global-data');
var dataLoader = require('./extensions/data-loader');
var statsInjector = require('./extensions/stats');
var codeHighlighting = require('./extensions/code-highlighting');
var prettyUrls = require('./extensions/pretty-urls');
var relativeUrls = require('./extensions/relative-path');

function Acetate () {
  // extend event emiiter
  events.EventEmitter.call(this);

  // bind all functions to `this`
  _.bindAll(this);
}

util.inherits(Acetate, events.EventEmitter);

Acetate.prototype._installDefaultExtensions = function (options) {
  this.use([
    markdownHelpers,
    codeHighlighting,
    prettyUrls,
    statsInjector,
    relativeUrls,
    dataLoader(options)
  ]);
};

Acetate.prototype._loadConfigFile = function (options) {
  if (require.cache[options.config]) {
    delete require.cache[options.config];
  }

  if (options.config) {
    try {
      require(path.join(this.root, this.config))(this);
    } catch (e) {
      this.log.error('config', 'error in config file - %s', this.log.formatException(e));
    }
  }
};

Acetate.prototype.init = function (options) {
  // setup logger
  this.log = logger(this, options.log);

  // setup parmeters users may want in their config files
  this.dest = 'build';
  this.src = 'src';
  this.args = options.args;
  this.config = options.config;
  this.root = options.root;

  // setup nunjucks and markdown so a user can customize them in their config
  this.nunjucks = nunjucks(this);
  this.markdown = markdown(this);

  // load the config file
  this._loadConfigFile(options);

  // install the default extensions
  this._installDefaultExtensions(options);

  // create a default source
  this.source('**/*.+(md|markdown|html)');

  // create components
  this.watcher = watcher(this);
  this.server = server(this);
  this.loader = loader(this);
  this.builder = builder(this);

  return this;
};

/**
 * Loader
 */

Acetate.prototype.load = function (callback) {
  this.loader.load(callback);
};

Acetate.prototype.loadPage = function (filepath, callback) {
  this.loader.loadPage(filepath, callback);
};

/**
 * Builder
 */

Acetate.prototype.build = function (callback) {
  this.builder.build(callback);
};

Acetate.prototype.runExtensions = function (callback) {
  this.builder.runExtensions(callback);
};

Acetate.prototype.warn = function (message) {
  this.builder.warn(message);
};

Acetate.prototype.error = function (message) {
  this.builder.error(message);
};

/**
 * Cleaner
 */

Acetate.prototype.clean = function (callback) {
  this.log.debug('clean', 'cleaning build folder');
  this.runExtensions(_.bind(function () {
    async.each(this.pages, function (page, cb) {
      page._clean(cb);
    }, _.bind(function (error) {
      if (error) {
        this.log.error('clean', 'error cleaning build folder', error);
      }

      if (callback) {
        callback(error);
      }

      this.emit('clean');
    }, this));
  }, this));
};

/**
 * Acetate Helpers
 */

Acetate.prototype.metadata = function (pattern, data) {
  this.use(metadataInjector(pattern, data));
};

Acetate.prototype.ignore = function (pattern) {
  this.use(metadataInjector(pattern, {
    ignore: true
  }));
};

Acetate.prototype.layout = function (pattern, layout) {
  this.use(metadataInjector(pattern, {
    layout: layout
  }));
};

Acetate.prototype.query = function (name, glob, builder) {
  this.use(query(name, glob, builder));
};

Acetate.prototype.transform = function (glob, builder) {
  this.use(transform(glob, builder));
};

Acetate.prototype.data = function (name, filepath) {
  this.use(globalData(name, filepath));
};

Acetate.prototype.use = function (extensions) {
  this._extensions = this._extensions || [];

  extensions = _.isArray(extensions) ? extensions : [extensions];

  for (var i = 0; i < extensions.length; i++) {
    this._extensions.push(extensions[i]);
  }
};

Acetate.prototype.source = function (matcher) {
  this._sources = this._sources || [];
  this._sources.push(path.join(this.root, this.src, matcher));
};

Acetate.prototype.global = function (key, value) {
  this.nunjucks.addGlobal(key, value);
};

/**
 * Template Helpers
 */

Acetate.prototype.filter = function (name, fn) {
  var wrapped = _.bind(function (value) {
    var result;
    try {
      result = fn(value);
    } catch (e) {
      var error = this.log.parseException(e);
      e.message = util.format('error in custom filter "%s" - %s:%d:%d', name, error.path, error.lineNo, error.colNo);
      throw e;
    }

    return result;
  }, this);

  this.nunjucks.addFilter(name, wrapped);
};

Acetate.prototype.helper = function (name, fn) {
  function CustomTag (acetate) {
    this.tags = [name];

    this.parse = function (parser, nodes) {
      // get the tag token
      var token = parser.nextToken();
      var args;

      if (parser.peekToken().type === 'block-end') {
        throw new Error('You must pass at least one parameter to custom helper "' + name + '"');
      } else {
        // parse the args and move after the block end. passing true
        // as the second arg is required if there are no parentheses
        args = parser.parseSignature(null, true);

        // advance the parser past the end of the block
        parser.advanceAfterBlockEnd(token.value);
      }

      // See above for notes about CallExtension
      return new nodes.CallExtension(this, 'run', args);
    };

    this.run = function () {
      var args = Array.prototype.slice.call(arguments);
      args[0] = args[0].ctx;
      var result;

      try {
        result = fn.apply(this, args);
      } catch (e) {
        var error = acetate.log.parseException(e);
        e.message = util.format('error in custom helper "%s" - %s:%d:%d', name, error.path, error.lineNo, error.colNo);
        throw e;
      }

      return result;
    };
  }

  this.nunjucks.addExtension(name, new CustomTag(this));
};

Acetate.prototype.block = function (name, fn) {
  function CustomTag (acetate) {
    this.tags = [name];

    this.parse = function (parser, nodes) {
      // get the tag token
      var token = parser.nextToken();

      // parse the args and move after the block end. passing true
      // as the second arg is required if there are no parentheses
      var args = parser.parseSignature(null, true);

      parser.advanceAfterBlockEnd(token.value);

      // parse the body
      var body = parser.parseUntilBlocks('end' + name);

      parser.advanceAfterBlockEnd();

      // See above for notes about CallExtension
      return new nodes.CallExtension(this, 'run', args, [body]);
    };

    this.run = function () {
      var args = Array.prototype.slice.call(arguments);
      var context = args.shift().ctx;
      var body = (args.pop())();

      var params = [context, body].concat(args); // body, context, args...
      var result;

      try {
        result = fn.apply(this, params);
      } catch (e) {
        var error = acetate.log.parseException(e);
        e.message = util.format('error in custom block "%s" - %s:%d:%d', name, error.path, error.lineNo, error.colNo);
        throw e;
      }

      return result;
    };
  }

  this.nunjucks.addExtension(name, new CustomTag(this));
};

module.exports = Acetate;
