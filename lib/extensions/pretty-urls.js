var _ = require('lodash');
var path = require('path');

var htmlRegex = /\.html?$/;
var indexRegex = /index\.html?$/;

module.exports = function (acetate, callback){
  acetate.log.verbose('extension', 'setting pretty urls');

  _.each(acetate.pages, function(page){
    if(htmlRegex.test(page.dest) && !indexRegex.test(page.dest) && page.prettyUrl !== false){
      page.url = page.url.replace(indexRegex, '').replace(htmlRegex, '');
      page.dest = page.dest.replace(htmlRegex, path.sep + 'index.html');
    }

    if(indexRegex.test(page.dest)){
      page.url = page.url.replace(indexRegex, '');
    }

    if(page.url[page.url.length-1] !== '/'){
      page.url += '/';
    }

    console.log(' ');
    console.log(page.src);
    console.log(page.url);
    console.log(page.dest);
    console.log(' ');
  });

  callback(undefined, acetate);
};