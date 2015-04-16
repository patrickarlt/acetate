var _ = require('lodash');
var async = require('async');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var fs = require('fs');

module.exports = function (acetate) {
  return function PageFactory (template, metadata) {
    var page = metadata;

    var clean = function (callback) {
      var buildpath = path.join(acetate.root, acetate.dest, page.dest);
      var dir = path.dirname(buildpath);
      rimraf(buildpath, function () {
        fs.readdir(dir, function (error, files) {
          if (files && files.length === 0) {
            fs.rmdir(dir, function (error) {
              if (callback) {
                callback(error);
              }
            });
          } else {
            if (callback) {
              callback(error);
            }
          }
        });
      });
    };

    var build = function (callback) {
      if (page.ignore || !page.__dirty) {
        callback();
      } else {
        async.waterfall([
          render,
          write
        ], function (error) {
          if (error) {
            handleBuildError(error);
          } else {
            acetate.log.success('page', 'built %s', page.src);
          }

          page.__dirty = false;

          callback();
        });
      }
    };

    var handleBuildError = function (errorMessage) {
      acetate.log.error('page', 'error building %s - %s', page.src, errorMessage);

      acetate.builder.error(errorMessage);
      var foo = path.resolve(__dirname, '../', 'templates');
      console.log(foo);
      fs.readFile(path.join(foo, 'error-page.html'), function (error, buffer) {
        if (error) {
          acetate.log.error('error', 'error loading error page template %s', error);
        }

        var rendered = acetate.nunjucks.renderString(buffer.toString(), {
          template: page.src,
          error: errorMessage
        });

        write(rendered, function () {
          acetate.log.debug('page', 'wrote error page for %s', page.src);
        });
      });
    };

    var render = function (callback) {
      if (page.__isMarkdown) {
        acetate.log.debug('page', 'starting markdown render for %s', page.src);
        async.waterfall([
          renderMarkdown,
          renderNunjucksWithLayout
        ], callback);
      } else {
        acetate.log.debug('page', 'starting nunjucks render for %s', page.src);
        renderNunjucksWithLayout(template, callback);
      }
    };

    var write = function (html, callback) {
      var outputPath = path.join(acetate.root, acetate.dest, page.dest);
      var outputDir = path.join(acetate.root, acetate.dest, path.dirname(page.dest));
      mkdirp(outputDir, function () {
        fs.writeFile(outputPath, html, function (error) {
          acetate.log.debug('page', '%s written to %s', page.src, page.dest);
          callback(error);
        });
      });
    };

    var renderMarkdown = function (callback) {
      callback(undefined, acetate.markdown.render(template));
    };

    var renderNunjucks = function (template, callback) {
      var rendered;
      var error;

      var context = _.omit(page, function (value, key) {
        return key[0] === '_';
      });

      try {
        rendered = acetate.nunjucks.renderString(template, context);
      } catch (e) {
        console.log(e.stack);
        error = e.message;
        if ((/ \[(Line) \d+, Column \d+\]/).test(e.message)) {
          var errorPath = e.message.match(/(.*): \((.*)\)/);
          var lineno = parseInt(e.message.match(/Line (\d+)/)[1], 10);
          var colno = parseInt(e.message.match(/Column (\d+)/)[1], 10);
          var message = e.message
                          .replace(/ \[(Line) \d+, Column \d+\]/, '')
                          .split('\n')[1]
                          .replace('Template render error: Template render error:', '')
                          .trim();

          if ((errorPath && errorPath[1] === page.src) || !errorPath) {
            lineno = lineno + page.__metadataLines;
          }

          error = message + ' - ' + path.join(acetate.src, page.src) + ':' + lineno + ':' + colno;
        } else {
          error = e.message.split('\n')[1]
                           .replace('Template render error: Template render error:', '')
                           .trim();
        }
      }

      callback(error, rendered);
    };

    var renderNunjucksWithLayout = function (template, callback) {
      acetate.log.debug('page', 'rendering %s with layout %s', page.src, page.layout);

      if (page.layout) {
        var layout = page.layout.split(':');
        var parent = layout[0];
        var block = layout[1];
        template = '{% extends \'' + parent + '\' %}{% block ' + block + ' %}' + template + '{% endblock %}';
      }

      renderNunjucks(template, callback);
    };

    return _.merge(page, {
      _build: build,
      _clean: clean
    });
  };
};
