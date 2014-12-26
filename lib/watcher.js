var Gaze = require('gaze').Gaze;
var fse = require('fs-extra');
var minimatch = require('minimatch');
var path = require('path');
var _ = require('lodash');

function AcetateWatcher (acetate) {
  this.acetate = acetate;
  _.bindAll(this);
}

AcetateWatcher.prototype.start = function(){
  this.watcher = new Gaze(this.acetate._sources);
  this.watcher.on('renamed', this.renamed);
  this.watcher.on('changed', this.changed);
  this.watcher.on('added', this.added);
  this.watcher.on('deleted', this.deleted);
};

AcetateWatcher.prototype.renamed = function(filepath, oldpath){
  oldpath = oldpath.replace(process.cwd() + path.sep, '');
  filepath = filepath.replace(process.cwd() + path.sep, '');

  this.acetate.log.info('watcher', "%s renamed to %s", oldpath, filepath);

  var insideSource = _.some(this.acetate._sources, function(source){
    return minimatch(filepath, source);
  });

  this._invalidateNunjucksCache(oldpath);
  this._removeOldPage(oldpath);

  if(insideSource) {
    // file was actually renamed and is still in the source folder
    this._loadNewPage(filepath);
  }
}

AcetateWatcher.prototype.changed = function(filepath){
  filepath = filepath.replace(process.cwd() + path.sep, '');
  this.acetate.log.info('watcher', "%s changed", filepath);

  this._removeOldPage(filepath);
  this._loadNewPage(filepath);
}

AcetateWatcher.prototype.deleted = function(filepath){
  filepath = filepath.replace(process.cwd() + path.sep, '');
  this.acetate.log.info('watcher', "%s deleted", filepath);

  this._removeOldPage(filepath);
}

AcetateWatcher.prototype.added = function(filepath){
  filepath = filepath.replace(process.cwd() + path.sep, '');
  this.acetate.log.info('watcher', "%s added", filepath);

  this._loadNewPage(filepath);
}

AcetateWatcher.prototype._removeOldPage = function(filepath){
  var page = _.remove(this.acetate.pages, {template: filepath})[0];

  if(page){
    this.acetate.log.verbose('watcher', "removing %s", page.dest);
    page.clean();
  }
};

AcetateWatcher.prototype._loadNewPage = function(filepath){
  if(path.basename(filepath)[0] === '_'){
    this.acetate.log.info('watcher', "layout or partial changed rebuilding all pages");
    _.each(this.acetate.pages, function(page){
        page.dirty = true;
    });
    this.acetate.build();
  } else {
    this.acetate.loadPage(filepath, _.bind(function(error, page){
      this.acetate.log.info('watcher', "rebuilding %s", filepath);
      this.acetate.pages.push(page);
      this.acetate.build();
    }, this));
  }
};

AcetateWatcher.prototype._invalidateNunjucksCache = function(filepath){
  var name = filepath.replace(this.acetate.src + path.sep, '').replace(path.extname(filepath), '');
  this.acetate.nunjucks.loaders[0].emit('update', name);
};

AcetateWatcher.prototype.stop = function(){
  this.watcher.close();
};

module.exports = AcetateWatcher;