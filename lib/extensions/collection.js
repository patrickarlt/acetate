var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (name, pattern) {
  pattern = new Minimatch(pattern);
  return function(press, callback){
    var collection = [];
    var pageWasDirty = false;
    _.each(press.pages, function(page){
      if(pattern.match(page.src)){
        pageWasDirty = pageWasDirty || page.dirty;
        collection.push(page);
        page[name] = collection;
      }
    });

    if(pageWasDirty) {
      _.each(collection, function(page){
        page.dirty = true;
      });
    }

    _.each(press.pages, function(page){
      _.each(page.collections, function(collection){
        if(_.contains(page.collections, name)) {
          page[name] = collection;
        }
      });
    });

    callback(null, press);
  }
}