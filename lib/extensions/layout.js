var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (pattern, layout) {
  pattern = new Minimatch(pattern);
  return function (press, callback){
    _.each(press.pages, function(page){
      if(pattern.match(page.src) && page.layout === undefined){
        page.layout = layout;
      }
    });
    callback(undefined, press);
  };
};