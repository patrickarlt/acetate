var async = require('async');
var fs = require('fs');
var glob = require('glob');
var path = require('path');
var _ = require('lodash');
var yaml = require('js-yaml');
var normalizeNewline = require('normalize-newline');

var pageFactory = require('./page-factory');

var metadataRegex = /^(-{3}?[\s\S]*?)---/m;
var markdownExt = /\.(md|markdown)/;

module.exports = function (acetate) {
  var page = pageFactory(acetate);
  var sources = [];
  var pages = [];

  function load (callback) {
    acetate.debug('loader', 'loading pages');
    acetate.time('load');

    async.each(sources, function (source, cb) {
      glob(source, loadPagesCallback(cb));
    }, function (error) {
      if (error) {
        acetate.emit('error', error);
      }

      acetate.emit('load', {
        count: acetate.pages.length || 0
      });

      acetate.info('loader', 'loaded %d pages in %s', acetate.pages.length, acetate.timeEnd('load'));

      if (callback) {
        callback(error, acetate.pages.length);
      }
    });
  }

  function loadPagesCallback (callback) {
    return function (error, filePaths) {
      if (error) {
        acetate.error('error loading pages', error);
      }

      var files = _.filter(filePaths, function (filepath) {
        return path.basename(filepath, path.extname(filepath))[0] !== '_';
      });

      async.map(files, acetate.loadPage, function (error, pages) {
        acetate.pages = acetate.pages.concat(pages);
        callback(error, pages.length);
      });
    };
  }

  function parseMetadata (filepath, raw) {
    var metadata = {};

    if (!raw) {
      return metadata;
    }

    try {
      metadata = yaml.safeLoad(raw);
    } catch (e) {
      acetate.error('page', '%s has invalid YAML metadata - %s', filepath, e.message || e);
    }

    return metadata;
  }

  function countLeadingNewLines (string) {
    var leadingNewLines = normalizeNewline(string).match(/^(\n*?)\S/);

    if (!leadingNewLines || !leadingNewLines[1]) {
      return 0;
    }

    return leadingNewLines[1].match(/\n/g).length;
  }

  function parseRawTemplate (relativepath, buffer) {
    var content = buffer.toString();
    var metadata = (content.match(metadataRegex) || [])[1] || '';
    var template = content.replace(metadataRegex, '');

    var _metadataLines = (metadata) ? normalizeNewline(metadata).split('\n').length : 0;
    var templateLines = countLeadingNewLines(template);

    return {
      _metadataLines: ((metadata) ? _metadataLines - 1 : 0) + templateLines,
      metadata: parseMetadata(relativepath, metadata),
      template: _.trim(template)
    };
  }

  function loadPage (filepath, callback) {
    fs.readFile(filepath, function (error, buffer) {
      filepath = filepath.replace(/\//g, path.sep); // glob always produces / even on windows where path seperator is \

      if (error) {
        acetate.error('page', 'could not load page at %s - %s', filepath, error);
        acetate.builder.error(error);
        callback();
        return;
      }

      var relativepath = filepath.replace(acetate.root + path.sep, '').replace(acetate.options.src + path.sep, '');
      var parsed = parseRawTemplate(relativepath, buffer);
      var markdown = markdownExt.test(path.extname(relativepath));
      var dest = relativepath.replace(markdownExt, '.html');

      var result = page(parsed.template, _.merge({
        _metadataLines: parsed._metadataLines,
        _isMarkdown: markdown,
        metadata: Object.freeze(_.cloneDeep(parsed.metadata)),
        dirty: true,
        fullpath: filepath,
        src: relativepath,
        url: dest.split(path.sep).join('/'),
        dest: dest
      }, parsed.metadata));

      callback(error, result);
    });
  }

  function source (matcher) {
    sources.push(path.join(acetate.src, matcher));
  }

  return {
    source: source,
    page: page,
    pages: pages,
    sources: sources,
    load: load,
    loadPage: loadPage
  };
};
