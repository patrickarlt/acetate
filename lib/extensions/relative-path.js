var _ = require('lodash');
var path = require('path');

module.exports = function (press, callback) {
  _.each(press.pages, function(page){
    var destination  = path.join(press.config.dest, page.dest);
    page.relativePath = path.relative(destination, press.config.dest).replace(/\.\.$/, '');
  });

  callback(null, press);
};