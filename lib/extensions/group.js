var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (name, pattern, options) {
  options = _.defaults(options || {}, {
    groupBy: false,

    sortGroups: function(){return 0;},
    sortPages: function(){return 0;},
    sortPagesAscending: true,

    groupSlug: function(key){
      return key.replace(/\s/g, '-').toLowerCase();
    }
  });

  pattern = new Minimatch(pattern);

  return function(acetate, callback) {
    acetate.log.verbose('extension', 'creating collection %s from pages matching %s', name, pattern);

    var pageWasDirty;

    var groups = _.chain(acetate.pages)
    .filter(function(page){
        var matches = pattern.match(page.src);
        pageWasDirty = pageWasDirty || (page.__dirty && matches);
        return matches;
    })
    .groupBy(options.groupBy)
    .transform(function(result, pages, key){
      var groupSlug = options.groupSlug(key);
      if(options.sortPages){
        pages = _.sortBy(pages, options.sortPages);
        if(!options.sortPagesAscending){
          pages.reverse();
        }
      }

      result[groupSlug] = {
        pages: pages,
        slug: groupSlug,
        name: key
      };
    }).sortBy(options.sortGroups).value();

    _.each(groups,function(group){
      _.each(group.pages, function(page){
        page.__dirty = true;
      });
    });

    function bindSequence(group, pos){
      group.pages[pos][name].previous = group.pages[pos - 1];
      group.pages[pos][name].next = group.pages[pos + 1];
    }

    _.each(groups,function(group){
      for (var i = 0; i < group.pages.length; i++) {
        group.pages[i][name] = {
          groups: groups,
          pages: group.pages,
          slug: group.slug,
          name: group.name
        };

        bindSequence(group, i);
      }
    });

    // since other extensions might add to the collection for a page
    // wrap this in anohter extension and run it at the end
    acetate.use(function(acetate, done){
      _.each(acetate.pages, function(page){
        _.forIn(page.groups, function(value, key){
          if(name === value){
            page[key] = {
              groups: groups
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