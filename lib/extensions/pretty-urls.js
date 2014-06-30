var _ = require('lodash');
var path = require('path');

var htmlRegex = /\.html?$/;
var indexRegex = /index\.html?$/;

module.exports = function (press, callback){
  _.each(press.pages, function(page){
    if(htmlRegex.test(page.dest) && !indexRegex.test(page.dest) && page.prettyUrl !== false){
      page.dest = page.dest.replace(htmlRegex, path.sep + 'index.html');
    }
  });
  callback(undefined, press);
};