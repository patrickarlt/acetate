var _ = require('lodash');
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var gaze = require('gaze');
var minimatch = require('minimatch');
var acetateUtils = require('./utils');
var nunjucks  = require('nunjucks');

module.exports = nunjucks.Loader.extend({
  init: function(options){
    this.templates = options.templates;
  },
  getSource: function(name){
    if(!name) {
      return null;
    }

    var matches = glob.sync(name + '.+(html|md|markdown)', {
      cwd: this.templates
    });

    if(matches && matches[0]){
      var fullpath = path.join(this.templates, matches[0]);
      return {
        src: acetateUtils.parseBody(fs.readFileSync(fullpath, 'utf-8')),
        path: fullpath
      };
    } else {
      return null;
    }
  }
});