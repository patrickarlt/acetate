var NunjucksMarkdown = require('../nunjucks-markdown');

module.exports = function (press, callback) {
  callback(null, press);
};

module.exports.register = function(press){
  press.nunjucks.addExtension('markdown', new NunjucksMarkdown({
    renderer: press.marked
  }));
};