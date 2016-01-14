var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var page = require('../mixins/page-factory.js');

module.exports = function (pages) {
  pages = (_.isArray(pages)) ? pages : [pages];

  return function output (acetate, next) {
    var createPage = page(acetate);
    var templateCache = {};
    var templates = _(pages).pluck('template').uniq().compact().value();

    function addPages () {
      var destinationIndex = _.indexBy(acetate.pages, 'dest');

      // call createPage using the template, markdown or nunjucks templates
      // and the metadata for the generated page
      _.each(pages, function (pageOptions) {
        var template = pageOptions.markdown || templateCache[pageOptions.template] || pageOptions.nunjucks || '';
        var metadata = getMetadata(pageOptions);
        var page = createPage(template, metadata);
        if (!destinationIndex[page.dest]) {
          acetate.pages.push(page);
        }
      });

      next(null, acetate);
    }

    // build metadata for generated page
    function getMetadata (page) {
      return _.merge({
        _metadataLines: 0,
        _isMarkdown: page.markdown,
        metadata: Object.freeze(_.cloneDeep(page.metadata || {})),
        dirty: (acetate.options.mode !== 'server'),
        fullpath: acetate.config,
        src: acetate.config,
        url: page.dest.split(path.sep).join('/'),
        dest: page.dest
      }, page.metadata);
    }

    // load each template into the template cache
    if (templates.length) {
      async.each(templates, function (template, callback) {
        fs.readFile(path.join(acetate.src, template), function (error, buffer) {
          if (error) {
            acetate.error('could not load %s', page.template);
          }

          templateCache[template] = buffer.toString();

          callback();
        });
      }, addPages);
    } else {
      addPages();
    }
  };
};
