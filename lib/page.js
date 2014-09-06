var _ = require('lodash');
var async = require('async');
var path = require('path');
var mkdirp = require('mkdirp');
var fse = require('fs-extra');
var acetateUtils = require('./utils');

function Page (metadata, acetate) {
  _.merge(this, metadata);
  _.bindAll(this);
  this._acetate = acetate;
  this._preRenderQueue = [];
}

Page.prototype.preRender = function(fn){
  this._preRenderQueue.push(fn);
};

Page.prototype._clean = function(callback){
  var buildpath = path.join(this._actate.dest, this.dest);
  fse.remove(buildpath, callback);
};

Page.prototype._build = function(callback){
  this.globals = this._acetate.globals;

  if(this.ignore || !this.dirty){
    callback(undefined, undefined);
  } else {
    console.log('building page', this.src);
    async.waterfall([
      this._setupBuild(),
      this._render(),
      this._write(),
    ], function(error, bytes){
      // @TODO catch error
      this.dirty = false;
      callback(error, bytes);
    });
  }
};

Page.prototype._getTemplate = function(callback){
  fs.readFile(this.template, function(error, buffer){
    callback(error, acetateUtils.parseBody(buffer.toString()));
  });
};

Page.prototype._setupBuild = function(){
  var outputDir =  path.join(this._acetate.root, this._acetate.dest, path.dirname(this.dest));

  return _.bind(function(callback){
    async.parallel({
      directory: _.partial(mkdirp, outputDir),
      template: this._getTemplate
    }, function(error, results){
      callback(error, results.template);
    });
  }, this);
};

Page.prototype._render = function(){
  return _.bind(function(template, callback){
    while (this._preRenderQueue.length){
      var fn = this._preRenderQueue.shift();
      fn(this);
    }

    if(this.markdown){
      this._renderMarkdown(template, callback);
    } else {
      this._renderNunjucksWithLayout(template, callback);
    }
  }, this);
};

Page.prototype._write = function (){
  var outputPath = path.join(this._acetate.root, this._acetate.dest, this.dest);
  return _.bind(function(html, callback){
    fs.writeFile(outputPath, html, function(error, bytes){
      callback(error, bytes);
    });
  }, this);
};

Page.prototype._renderMarkdown = function (template, callback) {
  async.waterfall([
    _.partial(this._renderNunjucks, template),
    this._acetate.marked,
    _.partial(this._renderNunjucksWithLayout),
  ], callback);
};

Page.prototype._renderNunjucks = function (template, callback) {
  this._acetate.nunjucks.renderString(template, this, callback);
};

Page.prototype._renderNunjucksWithLayout = function (template, callback) {
  if(this.layout){
    var parent = this.layout.split(':')[0];
    var block = this.layout.split(':')[1];
    template = "{% extends '" + parent + "' %}\n{% block " + block + " %}\n" + template + "\n{% endblock %}";
  }
  this._acetate.nunjucks.renderString(template, this, callback);
};

module.exports = Page;