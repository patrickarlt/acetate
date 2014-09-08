var _ = require('lodash');
var glob = require('glob');
var async = require('async');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var nunjucks  = require('nunjucks');
var marked = require('marked');
var Gaze = require('gaze').Gaze;
var fse = require('fs-extra');
var minimatch = require('minimatch');

var AcetateTemplateLoader = require('./acetate-nunjucks-loader');
var markdownHelpers = require('./extensions/markdown-helpers');
var metadataInjector = require('./extensions/metadata');
var collection = require('./extensions/collection');
var dataInjector = require('./extensions/data');
var statsInjector = require('./extensions/stats');
var codeHighlighting = require('./extensions/code-highlighting');
var prettyUrls = require('./extensions/pretty-urls');
var acetateUtils = require('./utils');
var relativeUrls = require('./extensions/relative-path');
var Page = require('./page');
var AcetateWatcher = require('./watcher');
var AcetateServer = require('./server');

function Acetate(config){
  this.options = {
    dest: 'build',
    src: 'src',
    data: 'data',
    root: process.cwd(),
    markdownExt: /\.(md|markdown)/,
    pageMatcher: '**/*.+(md|markdown|html)',
    dataMatcher: '**/*.+(js|json|yaml|yml)'
  };

  _.bindAll(this);

  this.args = require('minimist')(process.argv.slice(2));

  this._extensions = [];
  this.pages = [];
  this.collections = {};
  this.globals = {};

  this.marked = marked;

  this.nunjucks = new nunjucks.Environment(new AcetateTemplateLoader({
    templates: path.join(process.cwd(), this.options.src),
  }));

  if(config){
    require(config)(this);
  }

  this.use(markdownHelpers);
  this.use(codeHighlighting);
  this.use(prettyUrls);
  this.use(dataInjector);
  this.use(statsInjector);
  this.use(relativeUrls);

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
  if(extension.register){
    extension.register(this);
  }

  if (typeof extension === 'function'){
    this._extensions.push(extension);
  }
};

/**
 * Page Loader
 */

Acetate.prototype.loadPages = function (callback) {
  glob(path.join(this.options.src, this.options.pageMatcher), this._loadPagesCallback(callback));
};

Acetate.prototype._loadPagesCallback = function (callback){
  return _.bind(function(error, filePaths){
    var files = _.filter(filePaths, function(filePath){
      return acetateUtils.getFilename(filePath)[0] !== "_";
    });
    async.map(files, this.loadPage, function(error, pages){
      callback(error, pages);
    });
  }, this);
};

Acetate.prototype.loadPage = function(filepath, callback){
  fs.readFile(filepath, _.bind(function(error, buffer){
    var relativePath = filepath.replace(this.options.src + path.sep, '');
    var markdown = this.options.markdownExt.test(path.extname(relativePath));
    var rawMetadata = acetateUtils.parseMetadata(buffer, filepath);
    var metadata = _.merge({
      src: relativePath,
      template: filepath,
      dest: relativePath.replace(this.options.markdownExt, '.html'),
      markdown: markdown,
      dirty: true,
      _originalMetadata: rawMetadata
    }, rawMetadata);
    callback(error, new Page(metadata, this));
  },this));
};

/**
 * Data Loader
 */

Acetate.prototype.loadData = function (callback) {
  glob(path.join(this.options.data, this.options.dataMatcher), this._loadDataCallback(callback));
};

Acetate.prototype._loadDataCallback = function(callback){
  return _.bind(function(error, filePaths){
    async.map(filePaths, this.parseData, this._postProcessData(callback));
  }, this);
};

Acetate.prototype._postProcessData = function(callback) {
  return _.bind(function(error, dataFiles){
    var names = _.pluck(dataFiles, "name");
    var data = _.pluck(dataFiles, "data");
    callback(error, _.zipObject(names, data));
  }, this);
};

Acetate.prototype.parseData = function (filePath, callback) {
  var ext = path.extname(filePath);
  var parseCallback = Acetate.prototype.parseDataCallback(callback);

  if(ext === '.js') {
    this._parseModuleData(filePath, parseCallback);
  }

  if(ext === '.json') {
    this._parseJsonData(filePath, parseCallback);
  }

  if(ext === '.yaml' || ext === '.yml') {
    this._parseYamlData(filePath, parseCallback);
  }
};

Acetate.prototype.parseDataCallback = function(callback){
  return function (error, name, data){
    callback(error, {
      name: name,
      data: data
    });
  };
};

Acetate.prototype._parseYamlData = function(filepath, callback){
  var filename = acetateUtils.getFilename(filepath);

  fs.readFile(filepath, function(error, content){
    if(error){
      // @TODO warn about load error
      callback(null, {});
      return null;
    }

    var data = {};

    try {
      data = yaml.safeLoad(content.toString(), {
        strict: true
      });
    } catch (e) {
      // @TODO warn about load error
      console.log("yaml error!" + e);
    }
    callback(null, filename, data);
  });
};

Acetate.prototype._parseModuleData = function(filepath, callback){
  var modulepath = path.join(process.cwd(), filepath);
  var filename = acetateUtils.getFilename(filepath);
  delete require.cache[modulepath];
  require(modulepath)(function(error, data){
    data = data || {};
    if(error){
      // @TODO warn about error
    }
    callback(error, filename, data);
  });
};

Acetate.prototype._parseJsonData = function(filepath, callback){
  var filename = acetateUtils.getFilename(filepath);
  fs.readFile(filepath, function(error, content){
    if(error){
      // @TODO warn about load error
      callback(null, {});
      return null;
    }

    var data = {};

    try {
      data = JSON.parse(content.toString());
    } catch (e) {
      // @TODO warn about error
      console.log('JSON Error');
    }

    callback(error, filename, data);
  });
};

/**
 * Acetate Loading
 */

Acetate.prototype.load = function(callback){
  async.parallel({
    data: this.loadData,
    pages: this.loadPages
  }, this._loadCallback(callback));
};

Acetate.prototype._loadCallback = function (callback) {
  return _.bind(function(error, results){
    this.data = results.data;
    this.pages = results.pages;
    callback(error);
  }, this);
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