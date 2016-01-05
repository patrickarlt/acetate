var _ = require('lodash');
var path = require('path');

module.exports = function relativePath (acetate, callback) {
  acetate.verbose('extension', 'adding relative path property to each page');

  var buildFolder = acetate.dest.split(path.sep).join('/');

  _.each(acetate.pages, function (page) {
    var destination = path.join(acetate.dest, page.dest).split(path.sep).join('/');
    page.relativePath = path.relative(destination, buildFolder).replace(/\.\.$/, '').replace(/\\/g, '/');
  });

  callback(null, acetate);
};
