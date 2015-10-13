var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (pattern, data) {
  pattern = new Minimatch(pattern);

  return function (acetate, callback) {
    acetate.info('extension', 'printing debug into for pages matching %s', pattern.pattern);

    _.each(acetate.pages, function (page) {
      var metadata = _(page).omit(function (value, key) {
        return key[0] === '_';
      }).omit('build').omit('clean').value();

      if (pattern.match(page.src)) {
        acetate.info('debugger', '%s: %s', page.src, JSON.stringify(metadata, null, 2));
      }
    });

    callback(undefined, acetate);
  };
};
