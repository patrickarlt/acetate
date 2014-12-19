var _ = require('lodash');
var glob = require('glob');
var async = require('async');
var fs = require('fs');
var path = require('path');
var nunjucks  = require('nunjucks');
var marked = require('marked');
var util = require('util');
var events = require("events");

var markdownHelpers = require('./extensions/markdown-helpers');
var metadataInjector = require('./extensions/metadata');
var collection = require('./extensions/collection');
var dataInjector = require('./extensions/data');
var statsInjector = require('./extensions/stats');
var codeHighlighting = require('./extensions/code-highlighting');
var prettyUrls = require('./extensions/pretty-urls');
var relativeUrls = require('./extensions/relative-path');

var acetateUtils = require('./utils');
var Page = require('./page');
var AcetateTemplateLoader = require('./nunjucks-loader');
var AcetateWatcher = require('./watcher');
var AcetateServer = require('./server');
var Logger = require('./logger');

var markdownExt = /\.(md|markdown)/;

function Acetate(config){

  this.dest = 'build',
  this.src = 'src',
  this.root = process.cwd(),
  this.logLevel = 'info'

  _.bindAll(this);

  this.args = require('minimist')(process.argv.slice(2));
  this._sources = [];
  this._extensions = [];
  this.pages = [];
  this.collections = {};
  this.globals = {};

  this.marked = marked;

  this.nunjucks = new nunjucks.Environment(new AcetateTemplateLoader(this));

  if(config){
    this.config = config;
    if(require.cache[config]){
      delete require.cache[config];
    }
    require(config)(this);
  }

  this.source('**/*.+(md|markdown|html)');

  this.use(markdownHelpers);
  this.use(codeHighlighting);
  this.use(prettyUrls);
  this.use(dataInjector);
  this.use(statsInjector);
  this.use(relativeUrls);

  this.log = new Logger(this.logLevel);
  this.watcher = new AcetateWatcher(this);
  this.server = new AcetateServer(this);
}

Acetate.prototype.clean = function(callback){
  this.runExtensions(_.bind(function(){
    async.each(this.pages, function(page, cb){
      page.clean(cb);
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

Acetate.prototype.collection = function(name, pattern){
  this._extensions.push(collection(name, pattern));
};

Acetate.prototype.global = function(key, value){
  this.globals[key] = value;
};

Acetate.prototype.use = function(extension){
  this._extensions.push(extension);
};

Acetate.prototype.source = function(matcher){
  this._sources.push(path.join(this.src, matcher));
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
    var files = _.filter(filePaths, function(filePath){
      return acetateUtils.getFilename(filePath)[0] !== "_";
    });
    async.map(files, this.loadPage, _.bind(function(error, pages){
      this.pages = this.pages.concat(pages);
      callback();
    }, this));
  }, this);
};

Acetate.prototype.loadPage = function(filepath, callback){
  fs.readFile(filepath, _.bind(function(error, buffer){
    var relativePath = filepath.replace(this.src + path.sep, '');
    var markdown = markdownExt.test(path.extname(relativePath));
    var rawMetadata = acetateUtils.parseMetadata(buffer, filepath);
    var metadata = _.merge({
      src: relativePath,
      template: filepath,
      dest: relativePath.replace(markdownExt, '.html'),
      markdown: markdown,
      dirty: true,
      _originalMetadata: rawMetadata
    }, rawMetadata);
    callback(error, new Page(metadata, this));
  },this));
};

/**
 * Acetate Building
 */

Acetate.prototype.build = function(callback){
  async.series([
    this.runExtensions,
    this.buildPages
  ], callback);
};

Acetate.prototype.buildPages = function(callback){
  async.each(this.pages, _.bind(function(page, callback){
    page.build(callback);
  }, this), callback);
};

Acetate.prototype.runExtensions = function(callback) {
  var originalUse = this.use;
  var extensions = this._extensions.slice(0);

  var checkForExtensions = _.bind(function(){
    return extensions.length;
  }, this);

  var runNextExtension = _.bind(function(cb){
    var extension = extensions.shift();
    extension(this, cb);
  },this);

  async.whilst(checkForExtensions, runNextExtension, callback);
};

/**
 * Exports
 */

module.exports = Acetate;