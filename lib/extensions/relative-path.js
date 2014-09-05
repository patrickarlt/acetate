var _ = require('lodash');
var path = require('path');

module.exports = function (acetate, callback) {
  _.each(acetate.pages, function(page){
    var destination  = path.join(acetate.config.dest, page.dest);
    page.relativePath = path.relative(destination, acetate.config.dest).replace(/\.\.$/, '');
  });

  callback(null, acetate);
};