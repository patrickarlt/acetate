var Minimatch = require('minimatch').Minimatch;
var _ = require('lodash');

module.exports = function (matcher, transformer) {
  if (_.isString(matcher)) {
    var pattern = new Minimatch(matcher);
    matcher = function (page) { return pattern.match(page.src); };
  }

  return function (acetate, callback) {
    acetate.verbose('extension', 'transforming pages');

    transformer(_.filter(acetate.pages, matcher));

    callback(undefined, acetate);
  };
};
