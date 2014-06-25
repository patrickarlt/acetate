var _ = require('lodash');
var path = require('path');

module.exports = function (press, callback){
  var htmlRegex = /\.html?$/;
  var indexRegex = /index\.html?$/;
  _.each(press.pages, function(page){
    if(htmlRegex.test(page.dest) && !indexRegex.test(page.dest) && page.prettyUrl !== false){
      page.dest = page.dest.replace(htmlRegex, path.sep + 'index.html');
    }
  });
  callback(undefined, press);
};