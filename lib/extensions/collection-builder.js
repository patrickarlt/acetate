var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (name, pattern) {
  pattern = new Minimatch(pattern);
  return function(press, callback){
    var collection = [];
    _.each(press.pages, function(page){
      if(pattern.match(page.src)){
        page.collections = page.collections || [];
        page.collections.push(name);
        collection.push(page);
      }
    });
    press.collections[name] = _.chain(collection);
    callback(null, press);
  }
}