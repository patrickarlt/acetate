var glob = require('glob');
var path = require('path');
var fs = require('fs');
var pressUtils = require('./utils');

function PressTemplateLoader (options){
  this.templates = options.templates;
}

PressTemplateLoader.prototype.getSource = function(name) {
  var pattern = name + '.+(html|md|markdown)';
  var matches = glob.sync(pattern, {
    cwd: this.templates
  });

  // @TODO throw error when no matches are found

  var fullpath = path.join(this.templates, matches[0]);

  return {
    src: pressUtils.parseBody(fs.readFileSync(fullpath, 'utf-8')),
    path: fullpath
  };
};

module.exports = PressTemplateLoader;