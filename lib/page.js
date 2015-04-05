var _ = require('lodash');
var async = require('async');
var path = require('path');
var mkdirp = require('mkdirp');
var fse = require('fs-extra');
var fs = require('fs');

function Page (template, metadata,  acetate) {
  _.merge(this, metadata);

  this._acetate = acetate;
  this._template = template;

  _.bindAll(this);

  this._preRenderQueue = [];
}

Page.prototype._preRender = function(fn){
  this._preRenderQueue.push(fn);
};

Page.prototype._clean = function(callback){
  var buildpath = path.join(this._acetate.root, this._acetate.dest, this.dest);
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

Page.prototype._build = function(callback){
  this.globals = this._acetate.globals;

  if(this.ignore || !this.__dirty){
    callback();
  } else {
    async.waterfall([
      this._render(),
      this._write(),
    ], _.bind(function(error, bytes){

      if(error){
        this._handleBuildError(error);
      } else {
        this._acetate.log.success('page', 'built %s', this.src);
      }

      this.__dirty = false;

      callback();
    }, this));
  }
};

Page.prototype._handleBuildError = function(errorMessage){
  this._acetate.log.error('page', 'error building %s - %s', this.src, errorMessage);
  this._acetate.buildStatus('error');

  fs.readFile(path.join(__dirname, 'templates', 'error-page.html'), _.bind(function(error, buffer){
    var rendered = this._acetate.nunjucks.renderString(buffer.toString(), {
      template: this.src,
      error: errorMessage
    });

    this._write()(rendered, _.bind(function(){
      this._acetate.log.debug('page', 'wrote error page for %s', this.src);
    }, this));

  },this));
};

Page.prototype._render = function(){
  return _.bind(function(callback){
    while (this._preRenderQueue.length){
      var fn = this._preRenderQueue.shift();
      fn(this);
    }

    if(this.__isMarkdown){
      this._acetate.log.debug('page', 'starting markdown render for %s', this.src);
      async.waterfall([
        _.partial(this._renderNunjucks, this._template),
        this._acetate.marked,
        this._renderNunjucksWithLayout
      ], callback);
    } else {
      this._acetate.log.debug('page', 'starting nunjucks render for %s', this.src);
      this._renderNunjucksWithLayout(this._template, callback);
    }
  }, this);
};

Page.prototype._write = function (){
  var outputPath = path.join(this._acetate.root, this._acetate.dest, this.dest);
  var outputDir =  path.join(this._acetate.root, this._acetate.dest, path.dirname(this.dest));
  return _.bind(function(html, callback){
    mkdirp(outputDir, _.bind(function(){
      fs.writeFile(outputPath, html, _.bind(function(error){
        this._acetate.log.debug('page', '%s written to %s', this.src, this.dest);
        callback(error);
      }, this));
    }, this));
  }, this);
};

Page.prototype._renderNunjucks = function (template, callback) {
  var rendered;
  var error;

  var context = _.omit(this, function(value, key){
    return key[0] === '_';
  });

  try {
    rendered = this._acetate.nunjucks.renderString(template, context);
  } catch (e){
    error = e.message;
    if((/ \[(Line) \d+, Column \d+\]/).test(e.message)){
      var path = e.message.match(/(.*): \((.*)\)/);
      var lineno = parseInt(e.message.match(/Line (\d+)/)[1]);
      var colno = parseInt(e.message.match(/Column (\d+)/)[1]);
      var message = e.message.replace(/ \[(Line) \d+, Column \d+\]/, '').split('\n')[1].trim();

      if((path && path[1] === this.src) || !path){
        lineno = lineno + this.__metadataLines;
      }

      error = message + ' - line ' + lineno + ' - column ' + colno;
    } else {
      error = e.message.split('\n')[1].trim();
    }
  }

  callback(error, rendered);
};

Page.prototype._renderNunjucksWithLayout = function (template, callback) {
  this._acetate.log.debug('page', 'rendering %s with layout %s', this.src, this.layout);
  if(this.layout){
    var layout = this.layout.split(':');
    var parent = layout[0];
    var block = layout[1];
    template = '{% extends \'' + parent + '\' %}{% block ' + block + ' %}' + template + '{% endblock %}';
  }
  this._renderNunjucks(template, callback);
};

module.exports = Page;