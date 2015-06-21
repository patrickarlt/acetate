var _ = require('lodash');
var async = require('async');
var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');
var normalizeNewline = require('normalize-newline');

var markdownExt = /\.(md|markdown)/;

module.exports = function (acetate) {
  return function PageFactory (template, metadata) {
    var page = metadata;

    var clean = function (callback) {
      var buildpath = path.join(acetate.root, acetate.dest, page.dest);
      fs.unlink(buildpath, function (error) {
        if (!error) {
          acetate.emit('page:clean', page);
        }

        if (callback) {
          callback(error);
        }
      });
    };

    var build = function (callback) {
      if (page.ignore || !page.dirty) {
        callback();
      } else {
        async.waterfall([
          render,
          write
        ], function (error, html) {
          if (error) {
            handleBuildError(error, callback);
          } else {
            acetate.success('page', 'built %s', page.src);

            page.dirty = false;

            acetate.emit('page:build', page);
            callback(error, html);
          }
        });
      }
    };

    var handleBuildError = function (e, callback) {
      var message = (e.message || e);
      acetate.error('page', 'error building %s - %s', page.src, message);

      fs.readFile(path.join(path.resolve(__dirname, '../', 'templates'), 'error-page.html'), function (error, buffer) {
        if (error) {
          acetate.error('error', 'error loading error page template %s', error);
        }

        var rendered = acetate.nunjucks.renderString(buffer.toString(), {
          template: page.src,
          error: e
        });

        write(rendered, function () {
          acetate.debug('page', 'wrote error page for %s', page.src);
          callback(e, rendered);
        });
      });
    };

    var render = function (callback) {
      if (markdownExt.test(path.extname(page.src))) {
        acetate.debug('page', 'starting markdown render for %s', page.src);
        async.waterfall([
          renderMarkdown,
          renderNunjucksWithLayout
        ], callback);
      } else {
        acetate.debug('page', 'starting nunjucks render for %s', page.src);
        renderNunjucksWithLayout(template, callback);
      }
    };

    var write = function (html, callback) {
      var outputPath = path.join(acetate.root, acetate.dest, page.dest);
      var outputDir = path.join(acetate.root, acetate.dest, path.dirname(page.dest));

      mkdirp(outputDir, function () {
        fs.writeFile(outputPath, html, function (error) {
          acetate.debug('page', '%s written to %s', page.src, page.dest);
          callback(error, html);
        });
      });
    };

    var renderMarkdown = function (callback) {
      callback(undefined, acetate.markdown.render(template));
    };

    var getContext = function () {
      return _(page).omit(function (value, key) {
        return key[0] === '_';
      }).omit('build').omit('clean').value();
    };

    var renderNunjucks = function (template, callback) {
      var rendered;
      var error;

      try {
        rendered = acetate.nunjucks.renderString(template, getContext());
      } catch (e) {
        // if this looks like a nunjucks error with [Line ##, Column ##]
        // parse it and replace the line number accounting for any
        // metadata and reformat the error message
        if ((/ \[(Line) \d+, Column \d+\]/).test(e.message)) {
          var errorPath = e.message.match(/(.*): \((.*)\)/);
          var lineno = parseInt(e.message.match(/Line (\d+)/)[1], 10);
          var colno = parseInt(e.message.match(/Column (\d+)/)[1], 10);
          var message = normalizeNewline(e.message)
                          .replace(/ \[(Line) \d+, Column \d+\]/, '')
                          .split('\n')[1]
                          .trim();

          if ((errorPath && errorPath[1] === page.src) || !errorPath) {
            lineno = lineno + page._metadataLines;
          }
          e.message = message + ' - ' + path.join(acetate.src, page.src) + ':' + lineno + ':' + colno;
        } else {
          e.message = normalizeNewline(e.message).split('\n')[1]
                           .replace(/[a-zA-Z]+?: /, '')
                           .trim();
        }
        e.message.replace('Template render error:', '');
        error = e;
      }

      callback(error, rendered);
    };

    var renderNunjucksWithLayout = function (template, callback) {
      acetate.debug('page', 'rendering %s with layout %s', page.src, page.layout);

      if (page.layout) {
        var layout = page.layout.split(':');
        var parent = layout[0];
        var block = layout[1];
        template = '{% extends \'' + parent + '\' %}{% block ' + block + ' %}' + template + '{% endblock %}';
      }

      renderNunjucks(template, callback);
    };

    return _.merge(page, {
      build: build,
      clean: clean
    });
  };
};
