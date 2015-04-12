var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (name, pattern, builder) {
  var usingQuery = []; // cache of pages uses this query

  pattern = new Minimatch(pattern);

  return function(acetate, callback){
    acetate.log.verbose('extension', 'createing query %s form pages matching %s', name, pattern.pattern);

    var pages = _.filter(acetate.pages, function(page){ return pattern.match(page.src); });
    var results = builder(pages); // get the results of the query

    // is a page in the results dirty?
    var pageIsDirty = _.some(pages, '__dirty');

    // if a page in the results was dirty, also dirty all pages using the query
    if(pageIsDirty) {
      _.each(acetate.pages, function(page){
        if(_.include(usingQuery, page)){
          page.__dirty = true;
        }
      });
    }

    // now add a special property `query.name` to each
    // page when this is accessed it will return the
    // results to the template and register the page to
    //  be updated when the query changes
    _.each(acetate.pages, function(page){
      page.queries = page.queries || {}; // ensure a `queries` object on the page

      Object.defineProperty(page.queries, name, {
        configurable: true,
        get: function(){
          if(!_.include(usingQuery, page)){
            usingQuery.push(page);
          }

          return results;
        }
      });
    });

    callback(undefined, acetate);
  };
};