var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function metadata (pattern, data) {
  pattern = new Minimatch(pattern);

  return function (acetate, callback) {
    acetate.verbose('extension', 'assigning %j to pages matching %s', data, pattern.pattern);

    _.each(acetate.pages, function (page) {
      if (pattern.match(page.src)) {
        acetate.debug('metadata', 'assigning %j to pages matching %s', data, page.src);
        _.merge(page, data, page.metadata);
      }
    });

    callback(undefined, acetate);
  };
};
