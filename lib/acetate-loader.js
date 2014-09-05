var _ = require('lodash');
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var gaze = require('gaze');
var minimatch = require('minimatch');
var acetateUtils = require('./utils');
var nunjucks  = require('nunjucks');

var AcetateTemplateLoader = nunjucks.Loader.extend({
  init: function(options){
    this.templates = options.templates;
  },
  getSource: function(name){
    var pattern = name + '.+(html|md|markdown)';
    var matches = glob.sync(pattern, {
      cwd: this.templates
    });

    // @TODO throw error when no matches are found
    var fullpath = path.join(this.templates, matches[0]);

    return {
      src: acetateUtils.parseBody(fs.readFileSync(fullpath, 'utf-8')),
      path: fullpath
    };
  }
});

module.exports = AcetateTemplateLoader;