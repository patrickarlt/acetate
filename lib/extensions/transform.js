var Minimatch = require('minimatch').Minimatch;
var _ = require('lodash');

module.exports = function transform (matcher, transformer) {
  if (_.isString(matcher)) {
    var pattern = new Minimatch(matcher);
    matcher = function (page) { return pattern.match(page.src); };
  }

  return function transform (acetate, callback) {
    acetate.verbose('extension', 'transforming pages');

    transformer(_.filter(acetate.pages, matcher));

    callback(undefined, acetate);
  };
};
