var Minimatch = require('minimatch').Minimatch;

module.exports = function (pattern, transformer) {
  pattern = new Minimatch(pattern);

  return function (acetate, callback) {
    acetate.verbose('extension', 'transforming pages');

    transformer(acetate.pages);

    callback(undefined, acetate);
  };
};
