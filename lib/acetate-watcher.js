var Gaze = require('gaze').Gaze;
var fse = require('fs-extra');
var minimatch = require('minimatch');
var acetateUtils = require('./utils');

function AcetateWatcher (acetate) {
  this.acetate = acetate;
}

AcetateWatcher.prototype._invalidateNunjucksCache = function(filepath){
  var name = filepath.replace(this.acetate.src + path.sep, '').replace(path.extname(filepath), '');
  this.acetate.nunjucks.loaders[0].emit('update', name);
};

AcetateWatcher.prototype.start = function(){
  var pageMatcher = path.join(this.acetate.src, pageGlob);
  var dataMatcher = path.join(this.acetate.data, dataGlob);

  this.watcher = new Gaze([pageMatcher, dataMatcher]);

  this.watcher.on('renamed', _.bind(function(filepath, oldpath){
    filepath = filepath.replace(process.cwd() + path.sep, '');
    oldpath = (oldpath) ? oldpath.replace(process.cwd() + path.sep, '') : undefined;

    if(!minimatch(filepath, pageMatcher) && minimatch(oldpath, pageMatcher)){
      // handle this rename like a delete since the file left the source folder
      this._invalidateNunjucksCache(oldpath);
      this.handlePageDelete(oldpath);
    } else if(minimatch(filepath, pageMatcher)) {
      // file was actually renamed and is still in the source folder
      this._invalidateNunjucksCache(oldpath);
      this._invalidateNunjucksCache(filepath);
      this.handlePageRename(filepath, oldpath);
    }

    if(!minimatch(filepath, dataMatcher) && minimatch(oldpath, dataMatcher)){
      // handle this rename like a delete since the file left the source folder
      this.handleDataDelete(oldpath);
    } else if(minimatch(filepath, dataMatcher)) {
      // handle this rename like a delete since the file left the source folder
      this.handleDataRename(filepath, oldpath);
    }
  }, this));

  this.watcher.on('changed', _.bind(function(filepath){
    filepath = filepath.replace(process.cwd() + path.sep, '');
    if(minimatch(filepath, pageMatcher)){
      this.handlePageChange(filepath);
    }
    if(minimatch(filepath, dataMatcher)){
     this.handleDataChange(filepath);
    }
  }, this));

  this.watcher.on('deleted', _.bind(function(filepath){
    filepath = filepath.replace(process.cwd() + path.sep, '');
    if(minimatch(filepath, pageMatcher)){
      this.handlePageDelete(filepath);
    }
    if(minimatch(filepath, dataMatcher)){
     this.handleDataDelete(filepath);
    }
  }, this));
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
  filepath = filepath.replace(this.acetate.src + path.sep, '');
  var page = _.remove(this.acetate.pages, {src: filepath})[0];
  if(page && page.dest){
    var buildpath = path.join(this.acetate.dest, page.dest);
    fse.remove(buildpath);
  }
};

AcetateWatcher.prototype._loadNewPage = function(filepath){
  filepath = filepath.replace(path.join(this.acetate.root, this.acetate.src) + path.sep, '');
  if(path.basename(filepath)[0] !== '_'){
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