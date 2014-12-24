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
  var buildpath = path.join(this.acetate.dest, this.dest);
  var dir = path.dirname(buildpath);
  fse.remove(buildpath, function(){
    fs.readdir(dir, function(error, files){
      if(files && files.length === 0){
        fs.rmdir(dir, function(error){
          if (callback) {
            callback();
          }
        });
      } else {
        if (callback) {
          callback();
        }
      }
    });
  });

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

      if(error){
        this._handleBuildError(error);
      } else {
        this.acetate.log.success('page', 'built %s', this.template);
      }

      this.dirty = false;

      callback();
    }, this));
  }
};

Page.prototype._handleBuildError = function(errorMessage){
  //@TODO overwrite built page with error page
  this.acetate.log.error('page', 'error building %s - %s', this.template, errorMessage);
  this.acetate._buildError = true;
  fs.readFile(path.join(__dirname,'templates', 'error-page.html'), _.bind(function(error, buffer){
    var rendered = this.acetate.nunjucks.renderString(buffer.toString(), {
      template: this.template,
      error: errorMessage
    });

    this._write()(rendered, _.bind(function(){
      this.acetate.log.debug('page', 'wrote error page for %s', this.template);
    }, this));

  },this));
}

Page.prototype._setupBuild = function(){
  var outputDir =  path.join(process.cwd(), this.acetate.dest, path.dirname(this.dest));
  var template = this.template;

  return _.bind(function(callback){
    async.parallel({
      directory: function(cb){
        mkdirp(outputDir, cb);
      },
      template: _.bind(function(cb){
        fs.readFile(path.join(process.cwd(), template), _.bind(function(error, buffer){
          this.acetate.log.debug('page', 'loading %s', this.template);
          cb(error, acetateUtils.parseBody(buffer.toString()));
        }, this));
      }, this)
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
      this.acetate.log.debug('page', 'starting markdown render for %s', this.template);
      this._renderMarkdown(template, callback);
    } else {
      this.acetate.log.debug('page', 'starting nunjucks render for %s', this.template);
      this._renderNunjucksWithLayout(template, callback);
    }
  }, this);
};

Page.prototype._write = function (){
  var outputPath = path.join(process.cwd(), this.acetate.dest, this.dest);
  return _.bind(function(html, callback){
    fs.writeFile(outputPath, html, _.bind(function(error){
      this.acetate.log.debug('page', '%s written to %s', this.template, this.dest)
      callback(error);
    }, this));
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
  var rendered;
  var error;

  try {
    rendered = this.acetate.nunjucks.renderString(template, this);
  } catch (e){
    var lineno = parseInt(e.message.match(/Line (\d+)/)[1]) + this.__metadataLines;
    var message = e.message.split('\n')[1].trim();

    error = message + ' - line ' + lineno;
    rendered = '<div style="background: red; padding: 1em; font-size: 18px;">' + error + '</div>';
  }

  callback(error, rendered);
};

Page.prototype._renderNunjucksWithLayout = function (template, callback) {
  if(this.layout){
    var parent = this.layout.split(':')[0];
    var block = this.layout.split(':')[1];
    template = "{% extends '" + parent + "' %}{% block " + block + " %}" + template + "{% endblock %}";
  }
  this._renderNunjucks(template, callback);
};

module.exports = Page;