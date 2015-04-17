var async = require('async');
var fs = require('fs');
var glob = require('glob');
var path = require('path');
var _ = require('lodash');
var yaml = require('js-yaml');

var pageFactory = require('./page-factory');

var markdownExt = /\.(md|markdown)/;
var metadataRegex = /^(-{3}?[\s\S]*?)---/m;

module.exports = function (acetate) {
  var createPage = pageFactory(acetate);

  var load = function (callback) {
    async.each(acetate._sources, function (source, cb) {
      glob(source, loadPagesCallback(cb));
    }, function (error, count) {
      if (error) {
        acetate.emit('error', error);
      }

      acetate.emit('load', {
        count: count || 0
      });

      if (callback) {
        callback(error, count);
      }
    });
  };

  var loadPagesCallback = function (callback) {
    return function (error, filePaths) {
      if (error) {
        acetate.log.error('error loading pages', error);
      }

      var files = _.filter(filePaths, function (filepath) {
        return path.basename(filepath, path.extname(filepath))[0] !== '_';
      });

      async.map(files, acetate.loadPage, function (error, pages) {
        acetate.pages = (acetate.pages) ? acetate.pages.concat(pages) : pages;
        callback(error, pages.length);
      });
    };
  };

  var parseMetadata = function (filepath, raw) {
    var metadata = {};

    if (!raw) {
      return metadata;
    }

    try {
      metadata = yaml.safeLoad(raw);
    } catch (e) {
      acetate.log.warn('page', '%s has invalid YAML metadata - %s', filepath, e.message || e);
      acetate.builder.warn();
    }

    return metadata;
  };

  var countLeadingNewLines = function (string) {
    var leadingNewLines = string.match(/^(\n*?)\S/);

    if (!leadingNewLines || !leadingNewLines[1]) {
      return 0;
    }

    return leadingNewLines[1].match(/\n/g).length;
  };

  var parseRawTemplate = function (relativepath, buffer) {
    var content = buffer.toString();
    var metadata = (content.match(metadataRegex) || [])[1] || '';
    var template = content.replace(metadataRegex, '');

    var metadataLines = (metadata) ? metadata.split('\n').length : 0;
    var templateLines = countLeadingNewLines(template);

    return {
      metadataLines: ((metadata) ? metadataLines - 1 : 0) + templateLines,
      metadata: parseMetadata(relativepath, metadata),
      template: _.trim(template)
    };
  };

  var loadPage = function (filepath, callback) {
    fs.readFile(filepath, function (error, buffer) {
      filepath = filepath.replace(/\//g, path.sep); // glob always produces / even on windows where path seperator is \

      if (error) {
        acetate.log.error('page', 'could not load page at %s - %s', filepath, error);
        acetate.builder.error(error);
        callback();
        return;
      }

      var relativepath = filepath.replace(acetate.root + path.sep, '').replace(acetate.src + path.sep, '');
      var parsed = parseRawTemplate(relativepath, buffer);
      var dest = relativepath.replace(markdownExt, '.html');
      var page = createPage(parsed.template, _.merge({
        __metadataLines: parsed.metadataLines,
        __originalMetadata: parsed.metadata,
        __dirty: true,
        __isMarkdown: markdownExt.test(path.extname(filepath)),
        fullpath: filepath,
        url: dest,
        src: relativepath,
        dest: dest
      }, parsed.metadata));

      callback(error, page);
    });
  };

  return {
    load: load,
    loadPage: loadPage
  };
};
