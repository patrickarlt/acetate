var glob = require('glob');
var path = require('path');
var fs = require('fs');
var acetateUtils = require('./utils');
var nunjucks  = require('nunjucks');

module.exports = nunjucks.Loader.extend({
  init: function(acetate){
    this.acetate = acetate;
  },
  getSource: function(name){
    if(!name) {
      return null;
    }

    this.acetate.debug('nunjucks', 'searching for templates named %s', name);

    var matches = glob.sync(name + '.+(html|md|markdown)', {
      cwd: this.acetate.options.src
    });

    this.acetate.debug('nunjucks', 'found %d template(s) matching %s', matches.length, name);

    if(matches && matches[0]){
      var fullpath = path.join(this.acetate.options.src, matches[0]);

      this.acetate.debug('nunjucks', 'loading %s', fullpath);

      return {
        src: acetateUtils.parseBody(fs.readFileSync(fullpath, 'utf-8')),
        path: fullpath
      };
    } else {
      this.acetate.warn('nunjucks', 'could not find a template named %s', name);
      return null;
    }
  }
});