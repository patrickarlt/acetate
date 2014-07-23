var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (pattern, data) {
  pattern = new Minimatch(pattern);
  return function (press, callback){
    _.each(press.pages, function(page){
      if(pattern.match(page.src)){
        _.merge(page, data);
      }
    });
    callback(undefined, press);
  };
};