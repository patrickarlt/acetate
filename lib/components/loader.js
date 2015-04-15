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

  var loadPage = function (filepath, callback) {
    fs.readFile(filepath, function (error, buffer) {
      if (error) {
        acetate.log.error('page', 'could not load page at %s - %s', filepath, error);
        acetate.builder.error(error);
        callback();
        return;
      }

      filepath = filepath.replace(/\//g, path.sep); // glob always produces / even on windows where path seperator is \
      var relativePath = filepath.replace(acetate.root + path.sep, '').replace(acetate.src + path.sep, '');
      var raw = buffer.toString();
      var rawMetadata = raw.split(metadataRegex, 2)[1];
      var localMetadata = parseMetadata(relativePath, raw.split(metadataRegex, 2)[1]);
      var template = _.trim(raw.replace(metadataRegex, ''));
      var dest = relativePath.replace(markdownExt, '.html');
      var metadata = _.merge({
        __metadataLines: (rawMetadata) ? rawMetadata.split('\n').length : 0,
        __originalMetadata: localMetadata,
        __dirty: true,
        __isMarkdown: markdownExt.test(path.extname(filepath)),
        fullpath: filepath,
        url: dest,
        src: relativePath,
        dest: dest
      }, localMetadata);

      var page = createPage(template, metadata);

      callback(error, page);
    });
  };

  return {
    load: load,
    loadPage: loadPage
  };
};
