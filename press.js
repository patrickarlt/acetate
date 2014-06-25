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
var NunjucksMarkdown = require('./lib/extensions/nunjucks-markdown');
var metadataInjector = require('./lib/extensions/metadata');
var dataInjector = require('./lib/extensions/data');
var prettyUrls = require('./lib/extensions/pretty-urls');
var pressUtils = require('./lib/utils');

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

  this._extensions = [];
  this.pages = [];

  this.marked = marked;
  marked.setOptions(this.config.marked);

  this.nunjucks = new nunjucks.Environment(new PressTemplateLoader({
    templates: path.join(this.config.root, this.config.src),
  }), this.config.nunjucks);

  this.nunjucks.addExtension('markdown', new NunjucksMarkdown({
    renderer: this.marked
  }));
}

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

Press.prototype.use = function(extension){
  this._extensions.push(extension);
};

Press.prototype.loadPages = function (callback) {
   var cb = _.bind(function (error, filePaths){
    var files = _.filter(filePaths, function(filePath){
      return pressUtils.getFilename(filePath)[0] !== "_";
    });
    async.map(files, _.bind(this.loadPage, this), function(error, pages){
      callback(error, pages);
    });
  }, this);

  glob(this.config.src + '/**/*.+(md|markdown|html)', cb);
};

Press.prototype.loadData = function (callback) {
  function postProcessData(error, dataFiles){

    var names = _.pluck(dataFiles, "name");
    var data = _.pluck(dataFiles, "data");

    callback(error, _.zipObject(names, data));
  }

  function globCallback(error, files){
    async.map(files, this.parseData, postProcessData.bind(this));
  }

  glob(this.config.data + '**/*.+(json|js|yml|yaml)', globCallback.bind(this));

};

Press.prototype.parseData = function (filePath, callback) {
  var ext = path.extname(filePath),
      filename = pressUtils.getFilename(filePath);

  if(ext === '.js') {
    require(path.join(this.config.root,filePath))(function(error, data){
      callback(null, {
        name: filename,
        data: data
      });
    });
  }

  if(ext === '.json') {
    callback(null, {
      name: filename,
      data: require(path.join(this.config.root,filePath))
    });
  }

  if(ext === '.yaml' || ext === '.yml') {
    fs.readFile(path.join(this.config.root,filePath), function(error, content){
      callback(null, {
        name: filename,
        data: yaml.safeLoad(content.toString())
      });
    });
  }
};

Press.prototype.load = function(callback){
  async.parallel({
    data: this.loadData,
    pages: this.loadPages
  }, _.bind(function (error, results) {
    this.data = results.data;
    this.pages = results.pages;
    callback(error);
  },this));
};

Press.prototype.loadPage = function(filePath, callback){
  var markdownExt = /\.(md|markdown)/;
  fs.readFile(filePath, _.bind(function(error, buffer){
    var relativePath = filePath.replace(this.config.src + path.sep, '');
    var isMarkdown = markdownExt.test(path.extname(relativePath));
    var page = _.merge({
      src: relativePath,
      template: filePath,
      dest: relativePath.replace(markdownExt, '.html'),
      markdown: isMarkdown
    }, pressUtils.parseMetadata(buffer, filePath));
    callback(error, page);
  }, this));
};

Press.prototype.addPage = function(pageData){
  this.pages.push(pageData);
};

Press.prototype.build = function(callback){
  var buildFolder = path.join(this.config.root, this.config.dest);
  var nunjucks = this.nunjucks;
  var marked = this.marked;

  function renderMarkdown (template, page, cb) {
    nunjucks.renderString(template, page, function(error, markdown){
      // @TODO catch errors
      marked(markdown, cb);
    });
  }

  function renderPage (template, page, cb) {
    if(page.layout){
      var parent = page.layout.split(':')[0];
      var block = page.layout.split(':')[1];
      template = "{% extends '" + parent + "' %}\n{% block " + block + " %}\n" + template + "\n{% endblock %}";
    }
    nunjucks.renderString(template, page, cb);
  }

  function render(page, cb){
    var outputPath = path.join(buildFolder, page.dest);
    var outputDir =  path.join(buildFolder, path.dirname(page.dest));

    if(!page.ignore){
      async.parallel({
        directory: function(callback){
          var start = process.hrtime();
          mkdirp(outputDir, function(error, something){
            var end = process.hrtime(start);
            callback(error, something);
          });
        },
        template: function(callback){
          fs.readFile(page.template, function(error, buffer){
            callback(error, pressUtils.parseBody(buffer.toString()));
          });
        }
      }, function(error, results){
        // @TODO catch errors
        var template = results.template;
        var ext = path.extname(page.src);

        function renderComplete(error, html){
          // @TODO catch errors
          fs.writeFile(outputPath, html, function(error){
            cb(error, html);
          });
        }

        if(page.markdown){
          renderMarkdown(results.template, page, function (error, html) {
            // @TODO catch errors
            renderPage(html, page, renderComplete);
          });
        } else {
          renderPage(template, page, renderComplete);
        }
      });
    } else {
      cb(undefined, false);
    }
  }

  var extensionRunner = async.compose.apply(this, this._extensions.reverse());

  extensionRunner(this, _.bind(function (error, press) {
    // @TODO catch errors
    async.each(press.pages, _.bind(render, this), _.bind(function(error){
      // @TODO catch errors
      callback(error, this);
    }, this));
  }, this));
};

function createPress(options, callback){
  var press = new Press(options);
  press.load(function(error){
    callback(undefined, press);
    press.use(prettyUrls);
    press.use(dataInjector);
  });
}

module.exports = createPress;