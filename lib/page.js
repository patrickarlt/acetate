var _ = require('lodash');
var async = require('async');
var path = require('path');
var mkdirp = require('mkdirp');
var fse = require('fs-extra');
var fs = require('fs');
var acetateUtils = require('./utils');

function Page (metadata, acetate) {
  _.merge(this, metadata);
  _.bindAll(this);
  this.acetate = acetate;
  this._preRenderQueue = [];
}

Page.prototype.preRender = function(fn){
  this._preRenderQueue.push(fn);
};

Page.prototype.clean = function(callback){
  var buildpath = path.join(this.acetate.options.dest, this.dest);
  fse.remove(buildpath, callback);
};

Page.prototype.build = function(callback){
  this.globals = this.acetate.globals;

  if(this.ignore || !this.dirty){
    callback(undefined, undefined);
  } else {
    async.waterfall([
      this._setupBuild(),
      this._render(),
      this._write(),
    ], _.bind(function(error, bytes){
      // @TODO catch error
      this.dirty = false;
      callback(error, bytes);
    }, this));
  }
};

Page.prototype._setupBuild = function(){
  var outputDir =  path.join(process.cwd(), this.acetate.options.dest, path.dirname(this.dest));
  var template = this.template;

  return _.bind(function(callback){
    async.parallel({
      directory: function(cb){
        mkdirp(outputDir, cb);
      },
      template: function(cb){
        fs.readFile(path.join(process.cwd(), template), function(error, buffer){
          cb(error, acetateUtils.parseBody(buffer.toString()));
        });
      }
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
  var outputPath = path.join(process.cwd(), this.acetate.options.dest, this.dest);
  return _.bind(function(html, callback){
    fs.writeFile(outputPath, html, function(error, bytes){
      callback(error, bytes);
    });
  }, this);
};

Page.prototype._renderMarkdown = function (template, callback) {
  async.waterfall([
    _.partial(this._renderNunjucks, template),
    this.acetate.marked,
    _.partial(this._renderNunjucksWithLayout),
  ], callback);
};

Page.prototype._renderNunjucks = function (template, callback) {
  this.acetate.nunjucks.renderString(template, this, function(error, html){
    callback(error, html);
  });
};

Page.prototype._renderNunjucksWithLayout = function (template, callback) {
  if(this.layout){
    var parent = this.layout.split(':')[0];
    var block = this.layout.split(':')[1];
    template = "{% extends '" + parent + "' %}\n{% block " + block + " %}\n" + template + "\n{% endblock %}";
  }
  this.acetate.nunjucks.renderString(template, this, callback);
};

module.exports = Page;