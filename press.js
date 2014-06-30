var _ = require('lodash');
var glob = require('glob');
var async = require('async');
var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var nunjucks  = require('nunjucks');
var mkdirp = require('mkdirp');
var marked = require('marked');

var PressTemplateLoader = require('./lib/press-loader');
var markdownHelpers = require('./lib/extensions/markdown-helpers');
var metadataInjector = require('./lib/extensions/metadata');
var dataInjector = require('./lib/extensions/data');
var statsInjector = require('./lib/extensions/stats');
var prettyUrls = require('./lib/extensions/pretty-urls');
var pressUtils = require('./lib/utils');

var markdownExt = /\.(md|markdown)/;

function Press(options){
  this.config = _.defaults(options, {
    dest: 'build',
    src: 'src',
    data: 'data',
    root: process.cwd(),
    nunjucks: {},
    marked: {}
  });

  _.bindAll(this);

  this.runningExtension = false;

  this._extensions = [];
  this.pages = [];

  this.globals = {};

  this.marked = marked;
  marked.setOptions(this.config.marked);

  this.nunjucks = new nunjucks.Environment(new PressTemplateLoader({
    templates: path.join(this.config.root, this.config.src),
  }), this.config.nunjucks);
}

/**
 * Press Helpers
 */

Press.prototype.metadata = function(pattern, data){
  this._extensions.push(metadataInjector(pattern, data));
};

Press.prototype.ignore = function(pattern){
  this._extensions.push(metadataInjector(pattern, {
    ignore: true
  }));
};

Press.prototype.layout = function(pattern, layout){
  this._extensions.push(metadataInjector(pattern, {
    layout: layout
  }));
};

Press.prototype.collect = function(){
  // todo
};

Press.prototype.global = function(key, value){
  this.globals[key] = value;
};

Press.prototype.use = function(extension){
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

Press.prototype.loadPages = function (callback) {
  glob('**/*.+(md|markdown|html)',{
    cwd: path.join(this.config.root, this.config.src)
  }, this._loadPagesCallback(callback));
};

Press.prototype._loadPagesCallback = function (callback){
  return _.bind(function(error, filePaths){
    var files = _.filter(filePaths, function(filePath){
      return pressUtils.getFilename(filePath)[0] !== "_";
    });
    async.map(files, this.loadPage, function(error, pages){
      callback(error, pages);
    });
  }, this);
};

Press.prototype.loadPage = function(filePath, callback){
  filePath = path.join(this.config.src, filePath);
  fs.readFile(filePath, this._processPage(filePath, callback));
};

Press.prototype._processPage = function(filePath, callback){
  return _.bind(function(error, buffer){
    var relativePath = filePath.replace(this.config.src + path.sep, '');
    var isMarkdown = markdownExt.test(path.extname(relativePath));
    var page = _.merge({
      src: relativePath,
      template: filePath,
      dest: relativePath.replace(markdownExt, '.html'),
      markdown: isMarkdown
    }, pressUtils.parseMetadata(buffer, filePath));
    callback(error, page);
  },this);
};

/**
 * Data Loader
 */

Press.prototype.loadData = function (callback) {
  glob(this.config.data + '**/*.+(json|js|yml|yaml)', this._loadDataCallback(callback));
};

Press.prototype._loadDataCallback = function(callback){
  return _.bind(function(error, filePaths){
    async.map(filePaths, this._parseData, this._postProcessData(callback));
  }, this);
};

Press.prototype._postProcessData = function(callback) {
  return _.bind(function(error, dataFiles){
    var names = _.pluck(dataFiles, "name");
    var data = _.pluck(dataFiles, "data");
    callback(error, _.zipObject(names, data));
  }, this);
};

Press.prototype._parseData = function (filePath, callback) {
  var ext = path.extname(filePath);
  var parseCallback = Press.prototype._parseDataCallback(callback);

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

Press.prototype._parseDataCallback = function(callback){
  return function (error, name, data){
    callback(error, {
      name: name,
      data: data
    });
  };
};

Press.prototype._parseYamlData = function(filePath, callback){
  var filename = pressUtils.getFilename(filePath);

  fs.readFile(path.join(this.config.root, filePath), function(error, content){
    // @TODO error handling
    callback(null, filename, yaml.safeLoad(content.toString()));
  });
};

Press.prototype._parseModuleData = function(filePath, callback){
  var filename = pressUtils.getFilename(filePath);

  require(path.join(this.config.root,filePath))(function(error, data){
    // @TODO error handling
    callback(error, filename, data);
  });
};

Press.prototype._parseJsonData = function(filePath, callback){
  var filename = pressUtils.getFilename(filePath);

  fs.readFile(path.join(this.config.root, filePath), function(error, content){
    // @TODO error handling
    callback(error, filename, JSON.parse(content.toString()));
  });
};

/**
 * Press Loading
 */

Press.prototype.load = function(callback){
  async.parallel({
    data: this.loadData,
    pages: this.loadPages
  }, this._loadCallback(callback));
};

Press.prototype._loadCallback = function (callback) {
  return _.bind(function(error, results){
    this.data = results.data;
    this.pages = results.pages;
    callback(error);
  }, this);
};

/**
 * Press Building
 */

Press.prototype.buildPage = function (page, callback){
  page.globals = this.globals;
  page.page = page;
  if(!page.ignore){
    async.waterfall([
      this._setupPageBuild(page),
      this._renderPage(page),
      this._writePage(page),
    ], callback);
  } else {
    callback(undefined, false);
  }
};

Press.prototype._setupPageBuild = function(page){
  var outputDir =  path.join(this.config.root, this.config.dest, path.dirname(page.dest));

  return function(callback){
    async.parallel({
      directory: function(cb){
        mkdirp(outputDir, cb);
      },
      template: function(cb){
        fs.readFile(page.template, function(error, buffer){
          cb(error, pressUtils.parseBody(buffer.toString()));
        });
      }
    }, function(error, results){
      callback(error, results.template);
    });
  };
};

Press.prototype._renderPage = function(page){
  return _.bind(function(template, callback){
    if(page.markdown){
      this._renderMarkdown(page, template, callback);
    } else {
      this._renderNunjucksWithLayout(page, template, callback);
    }
  }, this);
};

Press.prototype._writePage = function (page){
  var outputPath = path.join(this.config.root, this.config.dest, page.dest);
  return _.bind(function(html, callback){
    fs.writeFile(outputPath, html, function(error, bytes){
      callback(error, bytes);
    });
  }, this);
};

Press.prototype._renderMarkdown = function (page, template, callback) {
  async.waterfall([
    _.partial(this._renderNunjucks, page, template),
    this.marked,
    _.partial(this._renderNunjucksWithLayout, page),
  ], callback);
};

Press.prototype._renderNunjucks = function (page, template, callback) {
  this.nunjucks.renderString(template, page, callback);
};

Press.prototype._renderNunjucksWithLayout = function (page, template, callback) {
  if(page.layout){
    var parent = page.layout.split(':')[0];
    var block = page.layout.split(':')[1];
    template = "{% extends '" + parent + "' %}\n{% block " + block + " %}\n" + template + "\n{% endblock %}";
  }
  this.nunjucks.renderString(template, page, callback);
};

Press.prototype.build = function(callback){
  async.series([
    this.runExtensions,
    this.buildPages
  ], callback);
};

Press.prototype.buildPages = function(callback){
  async.each(this.pages, this.buildPage, callback);
};

Press.prototype.runExtensions = function(callback) {
  var checkForExtensions = _.bind(function(){
    return this._extensions.length;
  }, this);

  var runNextExtension = _.bind(function(cb){
    var extension = this._extensions.shift();
    extension(this, cb);
  },this);

  async.whilst(checkForExtensions, runNextExtension, callback);
};

/**
 * Exports
 */

function createPress(options, callback){
  var press = new Press(options);
  press.load(function(error){
    press.use(markdownHelpers);
    callback(undefined, press);
    press.use(prettyUrls);
    press.use(dataInjector);
    press.use(statsInjector);
  });
}

module.exports = createPress;