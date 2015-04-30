var _ = require('lodash');
var Minimatch = require('minimatch').Minimatch;

module.exports = function (name, matcher, builder) {
  var usingQuery = []; // cache of pages uses this query

  if (_.isString(matcher)) {
    var pattern = new Minimatch(matcher);
    matcher = function (page) { return pattern.match(page.src); };
  }

  return function (acetate, callback) {
    acetate.verbose('extension', 'createing query %s form pages matching %s', name, matcher);

    var pages = _.filter(acetate.pages, matcher);
    var results = builder(pages); // get the results of the query

    // is a page in the results dirty?
    var pageIsDirty = _.some(pages, 'dirty');

    // if a page in the results was dirty, also dirty all pages using the query
    if (pageIsDirty) {
      _.each(acetate.pages, function (page) {
        if (_.include(usingQuery, page)) {
          page.dirty = true;
        }
      });
    }

    // now add a special property `query.name` to each
    // page when this is accessed it will return the
    // results to the template and register the page to
    //  be updated when the query changes
    _.each(acetate.pages, function (page) {
      page.queries = page.queries || {}; // ensure a `queries` object on the page

      Object.defineProperty(page.queries, name, {
        configurable: true,
        get: function () {
          if (!_.include(usingQuery, page)) {
            usingQuery.push(page);
          }

          return results;
        }
      });
    });

    callback(undefined, acetate);
  };
};
