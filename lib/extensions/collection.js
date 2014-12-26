var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (name, pattern) {

  pattern = new Minimatch(pattern);

  return function(acetate, callback){
    acetate.log.verbose('extension', 'creating collection %s from pages matching %s', name, pattern);

    var collection = [];
    var pageWasDirty = false;

    _.each(acetate.pages, function(page){
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

    _.each(acetate.pages, function(page){
      _.each(page.collections, function(collectionName){
        if(_.contains(page.collections, collectionName)) {
          page[name] = collection;
        }
      });
    });

    callback(null, acetate);
  };
};