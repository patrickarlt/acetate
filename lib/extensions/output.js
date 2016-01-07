var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var page = require('../mixins/page-factory.js');

module.exports = function (pages) {
  pages = (_.isArray(pages)) ? pages : [pages];

  var added = false;

  return function output (acetate, next) {
    if (added) {
      next(null, acetate);
      return;
    }

    var createPage = page(acetate);
    var templateCache = {};
    var templates = _(pages).pluck('template').uniq().compact().value();

    function addPages () {
      // call createPage using the template, markdown or nunjucks templates
      // and the metadata for the generated page
      _.each(pages, function (page) {
        var template = page.markdown || templateCache[page.template] || page.nunjucks || '';
        var metadata = getMetadata(page);
        acetate.pages.push(createPage(template, metadata));
      });

      added = true;

      next(null, acetate);
    }

    // build metadata for generated page
    function getMetadata (page) {
      return _.merge({
        _metadataLines: 0,
        _isMarkdown: page.markdown,
        metadata: Object.freeze(_.cloneDeep(page.metadata || {})),
        dirty: true,
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
