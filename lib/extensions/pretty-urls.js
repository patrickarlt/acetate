var _ = require('lodash');
var htmlRegex = /\.html?$/;
var indexRegex = /index\.html?$/;

module.exports = function (acetate, callback) {
  acetate.verbose('extension', 'setting pretty urls');

  _.each(acetate.pages, function (page) {
    if (page.prettyUrl !== false) {
      if (htmlRegex.test(page.dest) && !indexRegex.test(page.dest)) {
        page.url = page.url.replace(indexRegex, '').replace(htmlRegex, '');
        page.dest = page.dest.replace(htmlRegex, '/index.html');
      }

      if (indexRegex.test(page.dest)) {
        page.url = page.url.replace(indexRegex, '');
      }

      if (!page.url.length) {
        page.url = './';
      }

      if (page.url[page.url.length - 1] !== '/') {
        page.url += '/';
      }
    }
  });

  callback(undefined, acetate);
};
