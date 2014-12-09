var Gaze = require('gaze').Gaze;
var fse = require('fs-extra');
var minimatch = require('minimatch');
var acetateUtils = require('./utils');
var path = require('path');
var _ = require('lodash');

function AcetateWatcher (acetate) {
  this.acetate = acetate;
  this.pageMatcher = path.join(this.acetate.options.src, this.acetate.options.pageMatcher);
  this.dataMatcher = path.join(this.acetate.options.data, this.acetate.options.dataMatcher);
}

AcetateWatcher.prototype._invalidateNunjucksCache = function(filepath){
  var name = filepath.replace(this.acetate.options.src + path.sep, '').replace(path.extname(filepath), '');
  this.acetate.nunjucks.loaders[0].emit('update', name);
};

AcetateWatcher.prototype.handleWatchEvent = function(event, filepath, oldpath, callback){
  if(event === 'renamed'){
    this.handleRenameEvent(filepath, oldpath);
  }

  if(event === 'changed'){
    this.handleChangeEvent(filepath);
  }

  if(event === 'deleted') {
    this.handleDeleteEvent(filepath);
  }
};

AcetateWatcher.prototype.handleRenameEvent = function(filepath, oldpath){
  filepath = filepath.replace(process.cwd() + path.sep, '');
  oldpath = (oldpath) ? oldpath.replace(process.cwd() + path.sep, '') : undefined;

  if(!minimatch(filepath, this.pageMatcher) && minimatch(oldpath, this.pageMatcher)){
    // handle this rename like a delete since the file left the source folder
    this._invalidateNunjucksCache(oldpath);
    this.handlePageDelete(oldpath);
  } else if(minimatch(filepath, this.pageMatcher)) {
    // file was actually renamed and is still in the source folder
    this._invalidateNunjucksCache(oldpath);
    this._invalidateNunjucksCache(filepath);
    this.handlePageRename(filepath, oldpath);
  }

  if(!minimatch(filepath, this.dataMatcher) && minimatch(oldpath, this.dataMatcher)){
    // handle this rename like a delete since the file left the source folder
    this.handleDataDelete(oldpath);
  } else if(minimatch(filepath, this.dataMatcher)) {
    // handle this rename like a delete since the file left the source folder
    this.handleDataRename(filepath, oldpath);
  }
};

AcetateWatcher.prototype.handleChangeEvent = function(filepath){
  filepath = filepath.replace(process.cwd() + path.sep, '');

  if(minimatch(filepath, this.pageMatcher)){
    this.handlePageChange(filepath);
  }
  if(minimatch(filepath, this.dataMatcher)){
   this.handleDataChange(filepath);
  }
};

AcetateWatcher.prototype.handleDeleteEvent = function(filepath){
  filepath = filepath.replace(process.cwd() + path.sep, '');
  if(minimatch(filepath, this.pageMatcher)){
    this.handlePageDelete(filepath);
  }
  if(minimatch(filepath, this.dataMatcher)){
   this.handleDataDelete(filepath);
  }
};

AcetateWatcher.prototype.start = function(){
  this.watcher = new Gaze([this.pageMatcher, this.dataMatcher]);

  this.watcher.on('all', _.bind(this.handleWatchEvent, this));
};

AcetateWatcher.prototype._dirtyPagesWithData = function(name){
  _.each(this.acetate.pages, function(page){
    if(page.data && _.contains(page.data, name)){
      page.dirty = true;
    }
  });
};

AcetateWatcher.prototype._rebuildPagesWithData = function(error, obj){
  this.acetate.data[obj.name] = obj.data;
  this._dirtyPagesWithData(obj.name);
  this.acetate.build();
};

AcetateWatcher.prototype._removeData = function(name){
  delete this.acetate.data[name];
};

AcetateWatcher.prototype.handleDataAdd = function(filepath){
  this.acetate.parseData(filepath, this._rebuildPagesWithData);
};

AcetateWatcher.prototype.handleDataChange = function(filepath){
  this.acetate.parseData(filepath, this._rebuildPagesWithData);
};

AcetateWatcher.prototype.handleDataDelete = function(filepath){
  var name = acetateUtils.getFilename(filepath);
  this._removeData(name);
  this._dirtyPagesWithData(name);
  this.build();
};

AcetateWatcher.prototype.handleDataRename = function(newpath, oldpath){
  var oldname = acetateUtils.getFilename(oldpath);
  this._removeData(oldname);
  this._dirtyPagesWithData(oldname);
  this.acetate.parseData(newpath, this._rebuildPagesWithData);
};

AcetateWatcher.prototype._removeOldPage = function(filepath){
  filepath = filepath.replace(this.acetate.options.src + path.sep, '');

  _.remove(this.acetate.pages, {src: filepath});
};

AcetateWatcher.prototype._loadNewPage = function(filepath){
  filepath = filepath.replace(path.join(process.cwd(), this.acetate.options.src) + path.sep, '');

  // layout or partial rebuild all pages
  if(path.basename(filepath)[0] === '_'){
    _.each(this.acetate.pages, function(page){
        page.dirty = true;
    });
    this.acetate.build();
  } else {
    this.acetate.loadPage(filepath, _.bind(function(error, page){
      this.acetate.pages.push(page);
      this.acetate.build();
    }, this));
  }
};

AcetateWatcher.prototype.handlePageAdd = function(filepath){
  this._loadNewPage(filepath);
};

AcetateWatcher.prototype.handlePageChange = function(filepath){
  this._removeOldPage(filepath);
  this._loadNewPage(filepath);
};

AcetateWatcher.prototype.handlePageDelete = function(filepath){
  this._removeOldPage(filepath);
};

AcetateWatcher.prototype.handlePageRename = function(newpath, oldpath){
  this._removeOldPage(oldpath);
  this._loadNewPage(newpath);
};

AcetateWatcher.prototype.stop = function(){
  this.watcher.close();
};

module.exports = AcetateWatcher;