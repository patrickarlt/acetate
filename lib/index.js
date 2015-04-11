var _ = require('lodash');
var glob = require('glob');
var async = require('async');
var fs = require('fs');
var path = require('path');
var nunjucks  = require('nunjucks');
var MarkdownIt =  require('markdown-it');
var util = require('util');
var events = require('events');
var yaml = require('js-yaml');
var hljs = require('highlight.js');

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
var createPage = require('./extensions/page');

var Page = require('./page');
var AcetateTemplateLoader = require('./nunjucks-loader');
var AcetateWatcher = require('./watcher');
var AcetateServer = require('./server');
var Logger = require('./logger');

var markdownExt = /\.(md|markdown)/;
var metadataRegex = /^(-{3}?[\s\S]*?)---/m;

function Acetate(options){
  events.EventEmitter.call(this);

  this.dest = 'build';
  this.src = 'src';
  this.root = process.cwd();

  _.bindAll(this);

  this.log = new Logger({
    level: options.log
  });
  this.args = options.args;
  this._sources = [];
  this._extensions = [];
  this.pages = [];
  this.globals = {};

  this.nunjucks = new nunjucks.Environment(new AcetateTemplateLoader(this));
  this.markdown = new MarkdownIt({
    html: true,
    linkify: true,
    langPrefix: '',
    highlight: function(code, lang) {
      return (lang) ? hljs.highlight(lang, code).value : hljs.highlightAuto(code).value;
    }
  });

  this.config = options.config;
  this.root = path.dirname(options.config);

  if(require.cache[options.config]){
    delete require.cache[options.config];
  }

  if(options.config){
    try {
      require(options.config)(this);
    } catch (e){
      var stack = e.stack.split('\n');
      this.log.error('config', 'error in config file - %s', stack.shift());
      this.log.stacktrace(stack.shift());
    }
  }

  this.source('**/*.+(md|markdown|html)');

  this.use(markdownHelpers);
  this.use(codeHighlighting);
  this.use(prettyUrls);
  this.use(statsInjector);
  this.use(relativeUrls);
  this.use(dataLoader);

  this.watcher = new AcetateWatcher(this);
  this.server = new AcetateServer(this);
}

util.inherits(Acetate, events.EventEmitter);

Acetate.prototype.clean = function(callback){
  this.log.debug('clean', 'cleaning build folder');
  this.runExtensions(_.bind(function(){
    async.each(this.pages, function(page, cb){
      page._clean(cb);
    }, callback);
  }, this));
};

/**
 * Acetate Helpers
 */

Acetate.prototype.metadata = function(pattern, data){
  this._extensions.push(metadataInjector(pattern, data));
};

Acetate.prototype.ignore = function(pattern){
  this._extensions.push(metadataInjector(pattern, {
    ignore: true
  }));
};

Acetate.prototype.layout = function(pattern, layout){
  this._extensions.push(metadataInjector(pattern, {
    layout: layout
  }));
};

Acetate.prototype.query = function(name, glob, builder){
  this._extensions.push(query(name, glob, builder));
};

Acetate.prototype.transform = function(glob, builder){
  this._extensions.push(transform(glob, builder));
};

Acetate.prototype.data = function(name, path){
  this._extensions.push(globalData(name, path));
};

Acetate.prototype.page = function(templatepath, url, metadata){
  this._extensions.push(createPage(templatepath,url,metadata));
};

Acetate.prototype.use = function(extension){
  this._extensions.push(extension);
};

Acetate.prototype.source = function(matcher){
  this._sources.push(path.join(this.root, this.src, matcher));
};

Acetate.prototype.global = function(key, value){
  this.nunjucks.global(key, value);
};

Acetate.prototype.helper = function(name, fn) {
  var acetate = this;

  function CustomTag() {
    this.tags = [name];

    this.parse = function(parser, nodes, lexer) {
      // get the tag token
      var token = parser.nextToken();

      // parse the args and move after the block end. passing true
      // as the second arg is required if there are no parentheses
      var args = parser.parseSignature(null, true);

      parser.advanceAfterBlockEnd(token.value);

      // See above for notes about CallExtension
      return new nodes.CallExtension(this, 'run', args);
    };

    this.run = function(){
      var args = Array.prototype.slice.call(arguments);
      args[0] = args[0].ctx;
      var result;

      try {
        result = fn.apply(this, args);
      } catch (e) {
        e.message = e.message + ' - ' +  e.stack.split('\n')[1]
                                              .replace(process.cwd() + '/', '')
                                              .match(/\((.*)\)/)[1];
        throw e;
      }

      return result;
    };
  }

  this.nunjucks.addExtension(name, new CustomTag());
};

Acetate.prototype.block = function(name, fn){
  var acetate = this;

  function CustomTag() {
    this.tags = [name];

    this.parse = function(parser, nodes, lexer) {
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

    this.run = function(){
      var args = Array.prototype.slice.call(arguments);
      var context = args.shift().ctx;
      var body = (args.pop())();

      var params = [context, body].concat(args); // body, context, args...
      var result;

      try {
        result = fn.apply(this, params);
      } catch (e) {
        e.message = e.message + ' - ' +  e.stack.split('\n')[1]
                                              .replace(process.cwd() + '/', '')
                                              .match(/\((.*)\)/)[1];
        throw e;
      }

      return result;
    };
  }

  this.nunjucks.addExtension(name, new CustomTag());
};

Acetate.prototype.filter = function(name, fn){
  this.nunjucks.addFilter(name, fn);
};

/**
 * Page Loader
 */

Acetate.prototype.load = function (callback) {
  async.each(this._sources, _.bind(function(source, cb){
    glob(source, this._loadPagesCallback(cb));
  }, this), callback);
};

Acetate.prototype._loadPagesCallback = function (callback){
  return _.bind(function(error, filePaths){
    var files = _.filter(filePaths, function(filepath){
      return path.basename(filepath, path.extname(filepath))[0] !== '_';
    });
    async.map(files, this.loadPage, _.bind(function(error, pages){
      this.pages = this.pages.concat(pages);
      callback();
    }, this));
  }, this);
};


Acetate.prototype._parseMetadata = function(filepath, raw){
  var metadata = {};

  if(!raw){
    return metadata;
  }

  try {
    metadata = yaml.safeLoad(raw);
  } catch (e) {
    this.log.warn('page','%s has invalid YAML metadata - %s', filepath, e.message || e );
    this.buildStatus('warn');
  }

  return metadata;
};

Acetate.prototype.loadPage = function(filepath, callback){
  fs.readFile(filepath, _.bind(function(error, buffer){
    filepath = filepath.replace(/\//g, path.sep); // glob always produces / even on windows where path seperator is \
    var relativePath = filepath.replace(this.root + path.sep, '').replace(this.src + path.sep, '');
    var raw = buffer.toString();
    var rawMetadata = raw.split(metadataRegex, 2)[1];
    var localMetadata = this._parseMetadata(relativePath, raw.split(metadataRegex, 2)[1]);
    var template = raw.replace(metadataRegex, '');
    var dest = relativePath.replace(markdownExt, '.html');
    var metadata = _.merge({
      __metadataLines: (rawMetadata) ? rawMetadata.split('\n').length : 0,
      __originalMetadata: localMetadata,
      __dirty: true,
      __isMarkdown: markdownExt.test(path.extname(filepath)),
      fullpath: filepath,
      url: dest,
      src: relativePath,
      dest: dest
    }, localMetadata);
    callback(error, new Page(template, metadata, this));
  },this));
};

/**
 * Acetate Building
 */

Acetate.prototype.build = function(callback){
  this.log.time('build');
  this.log.verbose('build', 'starting build');
  this._buildStatus = undefined;
  async.series([
    this.runExtensions,
    this.buildPages
  ], _.bind(function(error){
    if(this.buildStatus() === 'error'){
      this.log.error('build', 'done in %s with errors', this.log.timeEnd('build'));
    } else if(this.buildStatus() === 'warn'){
      this.log.warn('build', 'done in %s with warnings', this.log.timeEnd('build'));
    } else {
      this.log.success('build', 'done in %s', this.log.timeEnd('build'));
    }
    if(callback){
      callback(this._buildError);
    }
    this.emit('build', {
      status: this.buildStatus() || 'success'
    });
  }, this));
};

Acetate.prototype.buildStatus = function(status){
  if(!status){
    return this._buildStatus;
  }

  if(status === 'error'){
    this._buildStatus = 'error';
  }

  if(status === 'warn' && !this._buildStatus) {
    this._buildStatus = 'warn';
  }
};

Acetate.prototype.buildPages = function(callback){
  this.log.verbose('build', 'building pages');
  async.each(this.pages, _.bind(function(page, callback){
    page._build(callback);
  }, this), callback);
};

Acetate.prototype.runExtensions = function(callback) {
  this.log.verbose('extension', 'running extensions');

  var originalUse = this.use;
  var extensions = this._extensions.slice(0);

  var checkForExtensions = _.bind(function(){
    return extensions.length;
  }, this);

  var runNextExtension = _.bind(function(cb){
    this.log.time('extension');
    var extension = extensions.shift();
    extension(this, _.bind(function(error, acetate){
      this.log.debug('extension', 'extension finished in %s', this.log.timeEnd('extension'));
      cb(error, acetate);
    }, this));
  },this);

  async.whilst(checkForExtensions, runNextExtension, _.bind(function(error){
    if(!error){
      callback();
    } else {
      this.log.error('extensions', 'error running extensions %s', error);
    }
  }, this));
};

/**
 * Exports
 */

module.exports = function(options, callback){
  options = _.defaults(options, {
    config: 'acetate.conf.js',
    watcher: false,
    server: false,
    host: 'localhost',
    port: 8000,
    findPort: false,
    open: false,
    clean: false,
    log: false
  });

  function buildCallback(error){
    if(callback) {
      callback(error, site);
    }
  }

  var site = new Acetate(options);

  site.log.time('load');

  site.load(function(){
    site.log.verbose('load', 'loading pages done in %s', site.log.timeEnd('load'));

    if(options.clean){
      site.log.time('clean');
      site.clean(function(error){
        site.log.verbose('cleaning', 'cleaning build folder done in %s', site.log.timeEnd('clean'));
        site.build(buildCallback);
      });
    } else {
      site.build(buildCallback);
    }
  });

  if(options.server || options.watcher){
    site.watcher.start(options);
  }

  if(options.server) {
    site.server.start(options);
  }

  return site;
};