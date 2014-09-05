var NunjucksMarkdown = require('../nunjucks-markdown');

module.exports = function (acetate, callback) {
  callback(null, acetate);
};

module.exports.register = function(acetate){
  acetate.nunjucks.addExtension('markdown', new NunjucksMarkdown({
    renderer: acetate.marked
  }));
};