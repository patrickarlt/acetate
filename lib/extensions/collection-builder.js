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
        page.collections = page.collections || [];
        page.collections.push(name);
        collection.push(page);
      }
    });

    if(pageWasDirty) {
      _.each(collection, function(page){
        page.dirty = true;
      });
    }

    press.collections[name] = collection;
    callback(null, press);
  }
}