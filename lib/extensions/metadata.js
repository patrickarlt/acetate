var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (pattern, data) {
  pattern = new Minimatch(pattern);

  return function (acetate, callback){
    acetate.log.debug('extension', 'assigning %j to pages matching %s', data, pattern.pattern);

    _.each(acetate.pages, function(page){
      if(pattern.match(page.src)){
        _.merge(page, data, page._originalMetadata);
      }
    });

    callback(undefined, acetate);
  };
};