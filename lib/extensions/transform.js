var Minimatch = require('minimatch').Minimatch;

module.exports = function (pattern, transformer) {
  pattern = new Minimatch(pattern);

  return function (acetate, callback) {
    acetate.log.verbose('extension', 'transforming to pages matching %s', pattern.pattern);

    transformer(acetate.pages);

    callback(undefined, acetate);
  };
};
