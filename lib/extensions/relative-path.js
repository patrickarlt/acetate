var _ = require('lodash');
var path = require('path');

module.exports = function (acetate, callback) {
  acetate.log.debug('extension', 'adding relative path property to each page');

  _.each(acetate.pages, function(page){
    var destination  = path.join(acetate.dest, page.dest);
    page.relativePath = path.relative(destination, acetate.dest).replace(/\.\.$/, '');
  });

  callback(null, acetate);
};