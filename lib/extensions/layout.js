var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (pattern, layout) {
  pattern = new Minimatch(pattern);

  return function (acetate, callback){
    _.each(acetate.pages, function(page){
      if(pattern.match(page.src) && page.layout === undefined){
        page.layout = layout;
      }
    });
    callback(undefined, acetate);
  };
};