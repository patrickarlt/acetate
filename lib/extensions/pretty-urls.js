var _ = require('lodash');
var path = require('path');

var htmlRegex = /\.html?$/;
var indexRegex = /index\.html?$/;

module.exports = function prettyUrls (acetate, callback) {
  acetate.verbose('extension', 'setting pretty urls');

  _.each(acetate.pages, function (page) {
    // if pretty URLs have not been disabled AND this is an html page
    if (page.prettyUrl !== false && htmlRegex.test(page.dest)) {
      // if this is an index page
      if (indexRegex.test(page.dest)) {
        page.url = page.url.replace(indexRegex, ''); // transform index.html into ''
      } else {
        page.url = page.url.replace(htmlRegex, '/'); // transform page.html into page/
        page.dest = page.dest.replace(htmlRegex, path.sep + 'index.html'); // transform page.html into page/index.html
      }

      // if there is no URL at this point this is the root page which should be '/'
      if (!page.url) {
        page.url = '/';
      }
    }
  });

  callback(undefined, acetate);
};
