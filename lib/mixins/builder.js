var async = require('async');
var _ = require('lodash');

module.exports = function (acetate) {
  var inProgress;
  var extensions = [];

  function use (ext) {
    ext = _.isArray(ext) ? ext : [ext];

    for (var i = 0; i < ext.length; i++) {
      extensions.push(ext[i]);
    }
  }

  var build = function (callback) {
    if (inProgress) {
      acetate.info('build', 'all ready building, queuing build after current build');
      acetate.on('build', build);
      return;
    }

    var warnings = [];
    var errors = [];

    function logger (e) {
      if (e.level === 'warn') {
        warnings.push(e.message);
      }

      if (e.level === 'error') {
        errors.push(e.message);
      }
    }

    inProgress = true;

    acetate.on('log', logger);

    acetate.time('build');
    acetate.verbose('build', 'starting build');

    async.series([
      runExtensions,
      buildPages
    ], function () {
      inProgress = false;

      var status = 'success';

      if (warnings.length) {
        status = 'warn';
      }

      if (errors.length) {
        status = 'error';
      }

      acetate[status]('build', 'done in %s with %d errors and %d warnings', acetate.timeEnd('build'), errors.length, warnings.length);

      if (callback) {
        callback();
      }

      acetate.removeListener('log', logger);

      acetate.emit('build', {
        status: status,
        errors: errors,
        warnings: warnings
      });
    });
  };

  var buildPages = function (callback) {
    acetate.verbose('build', 'building pages');
    async.each(acetate.pages, function (page, cb) {
      page.build(cb);
    }, callback);
  };

  var runExtensions = function (callback) {
    acetate.verbose('extension', 'running extensions');

    var pendingExtensions = extensions.slice(0);

    var checkForExtensions = function () {
      return pendingExtensions.length;
    };

    var runNextExtension = function (cb) {
      acetate.time('extension');
      var currentExtension = pendingExtensions.shift();
      currentExtension(acetate, function (error, acetate) {
        acetate.debug('extension', 'extension finished in %s', acetate.timeEnd('extension'));
        cb(error, acetate);
      });
    };

    async.whilst(checkForExtensions, runNextExtension, function (error) {
      if (!error) {
        callback();
      } else {
        acetate.error('extensions', 'error running extensions %s', error);
      }
    });
  };

  return {
    use: use,
    extensions: extensions,
    build: build,
    runExtensions: runExtensions
  };
};
