var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (pattern, data) {
  pattern = new Minimatch(pattern);

  return function (acetate, callback){
    acetate.log.verbose('extension', 'assigning %j to pages matching %s', data, pattern.pattern);

    _.each(acetate.pages, function(page){
      if(pattern.match(page.src)){
        acetate.log.debug('metadata', 'assigning %j to pages matching %s', data, page.src);
        _.merge(page, data, page.__originalMetadata);
        acetate.log.debug('metadata', 'page %s has layout %s', page.src, page.layout);
      }
    });

    callback(undefined, acetate);
  };
};