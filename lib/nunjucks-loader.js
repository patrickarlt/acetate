var glob = require('glob');
var path = require('path');
var fs = require('fs');
var nunjucks  = require('nunjucks');

module.exports = nunjucks.Loader.extend({
  init: function(acetate){
    this.acetate = acetate;
  },
  getSource: function(name){
    if(!name) {
      return null;
    }

    this.acetate.log.debug('nunjucks', 'searching for templates named %s', name);

    var matches = glob.sync(name + '.+(html|md|markdown)', {
      cwd: path.join(this.acetate.root, this.acetate.src)
    });

    this.acetate.log.debug('nunjucks', 'found %d template(s) matching %s', matches.length, name);

    if(matches && matches[0]){
      var fullpath = path.join(this.acetate.root, this.acetate.src, matches[0]);

      this.acetate.log.debug('nunjucks', 'loading %s', fullpath);

      return {
        src: fs.readFileSync(fullpath, 'utf-8').split(/^([\s\S]+)^-{3}$/m)[0],
        path: fullpath
      };
    } else {
      this.acetate.log.warn('nunjucks', 'could not find a template named %s', name);
      return null;
    }
  }
});