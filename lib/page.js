var _ = require('lodash');
var async = require('async');
var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');
var pressUtils = require('./utils');

function Page (metadata, press) {
  _.merge(this, metadata);
  _.bindAll(this);
  this._press = press;
  this._preRenderQueue = [];
}

Page.prototype.preRender = function(fn){
  this._preRenderQueue.push(fn);
};

Page.prototype._build = function(callback){
  this.globals = this._press.globals;

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
    callback(error, pressUtils.parseBody(buffer.toString()));
  });
};

Page.prototype._setupBuild = function(){
  var outputDir =  path.join(this._press.config.root, this._press.config.dest, path.dirname(this.dest));

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
  var outputPath = path.join(this._press.config.root, this._press.config.dest, this.dest);
  return _.bind(function(html, callback){
    fs.writeFile(outputPath, html, function(error, bytes){
      callback(error, bytes);
    });
  }, this);
};

Page.prototype._renderMarkdown = function (template, callback) {
  async.waterfall([
    _.partial(this._renderNunjucks, template),
    this._press.marked,
    _.partial(this._renderNunjucksWithLayout),
  ], callback);
};

Page.prototype._renderNunjucks = function (template, callback) {
  this._press.nunjucks.renderString(template, this, callback);
};

Page.prototype._renderNunjucksWithLayout = function (template, callback) {
  if(this.layout){
    var parent = this.layout.split(':')[0];
    var block = this.layout.split(':')[1];
    template = "{% extends '" + parent + "' %}\n{% block " + block + " %}\n" + template + "\n{% endblock %}";
  }
  this._press.nunjucks.renderString(template, this, callback);
};

module.exports = Page;