var _ = require('lodash');
var async = require('async');
var path = require('path');
var mkdirp = require('mkdirp');
var fse = require('fs-extra');
var fs = require('fs');

function Page (template, metadata, config,  acetate) {

  _.merge(this, config);

  this.metadata = metadata;
  this.acetate = acetate;
  this.template = template;

  _.bindAll(this);

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
    callback();
  } else {
    async.waterfall([
      // this._setupBuild(),
      this._render(),
      this._write(),
    ], _.bind(function(error, bytes){

      if(error){
        this._handleBuildError(error);
      } else {
        this.acetate.log.success('page', 'built %s', this.src);
      }

      this.dirty = false;

      callback();
    }, this));
  }
};

Page.prototype._handleBuildError = function(errorMessage){
  this.acetate.log.error('page', 'error building %s - %s', this.src, errorMessage);
  this.acetate.buildStatus('error');
  fs.readFile(path.join(__dirname,'templates', 'error-page.html'), _.bind(function(error, buffer){
    var rendered = this.acetate.nunjucks.renderString(buffer.toString(), {
      template: this.src,
      error: errorMessage
    });

    this._write()(rendered, _.bind(function(){
      this.acetate.log.debug('page', 'wrote error page for %s', this.src);
    }, this));

  },this));
}

Page.prototype._render = function(){
  return _.bind(function(callback){
    while (this._preRenderQueue.length){
      var fn = this._preRenderQueue.shift();
      fn(this);
    }

    if(this.markdown){
      this.acetate.log.debug('page', 'starting markdown render for %s', this.src);
      this._renderMarkdown(callback);
    } else {
      this.acetate.log.debug('page', 'starting nunjucks render for %s', this.src);
      this._renderNunjucksWithLayout(callback);
    }
  }, this);
};

Page.prototype._write = function (){
  var outputPath = path.join(process.cwd(), this.acetate.dest, this.dest);
  var outputDir =  path.join(process.cwd(), this.acetate.dest, path.dirname(this.dest));
  return _.bind(function(html, callback){
    mkdirp(outputDir, _.bind(function(){
      fs.writeFile(outputPath, html, _.bind(function(error){
        this.acetate.log.debug('page', '%s written to %s', this.src, this.dest)
        callback(error);
      }, this));
    }, this));
  }, this);
};

Page.prototype._renderMarkdown = function (callback) {
  async.waterfall([
    _.partial(this._renderNunjucks, this.template),
    this.acetate.marked,
    this._renderNunjucksWithLayout,
  ], callback);
};

Page.prototype._renderNunjucks = function (template, callback) {
  var rendered;
  var error;

  var context = _.merge(this.metadata, {
    src: this.src,
    dest: this.dest
  });

  try {
    rendered = this.acetate.nunjucks.renderString(template, context);
  } catch (e){
    var lineno = parseInt(e.message.match(/Line (\d+)/)[1]) + this.__metadataLines;
    var message = e.message.split('\n')[1].trim();
    error = message + ' - line ' + lineno;
  }

  callback(error, rendered);
};

Page.prototype._renderNunjucksWithLayout = function (callback) {
  var template;

  if(this.metadata.layout){
    var layout = this.metadata.layout.split(':');
    var parent = layout[0];
    var block = layout[1];
    template = "{% extends '" + parent + "' %}{% block " + block + " %}" + this.template + "{% endblock %}";
  } else {
    template = this.template;
  }

  this._renderNunjucks(template, callback);
};

module.exports = Page;