var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (name, pattern, options) {
  options = _.defaults(options || {}, {
    sortBy: false,
    ascending: true // a-z, low-high
  });

  pattern = new Minimatch(pattern);

  return function(acetate, callback){
    acetate.log.verbose('extension', 'creating collection %s from pages matching %s', name, pattern);

    var pages = [];
    var pageWasDirty = false;

    _.each(acetate.pages, function(page){
      if(pattern.match(page.src)){
        pageWasDirty = pageWasDirty || page.__dirty;
        pages.push(page);
      }
    });

    if(pageWasDirty) {
      _.each(pages, function(page){
        page.__dirty = true;
      });
    }

    if(options.sortBy){
      pages = _.sortBy(pages, options.sortBy);
      if(!options.ascending){
        pages.reverse();
      }
    }

    function bindSequence(pos){
      pages[pos][name].previous = pages[pos - 1];
      pages[pos][name].next = pages[pos + 1];
    }

    for (var i = 0; i < pages.length; i++) {
      pages[i][name] = {
        all: pages
      };

      bindSequence(i);
    }

    // since other extensions might add to the groups for a page
    // wrap this in anohter extension and run it at the end
    acetate.use(function(acetate, done){
      _.each(acetate.pages, function(page){
        _.forIn(page.collections, function(value, key){
          if(name === value){
            page[key] = {
              all: pages
            };
            if(pageWasDirty){
              page.__dirty = true;
            }
          }
        });
      });
      done(undefined, acetate);
    });

    callback(null, acetate);
  };
};