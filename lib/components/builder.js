var async = require('async');

module.exports = function (acetate) {
  var warnings = [];
  var errors = [];
  var inProgress;

  var build = function (callback) {
    if (inProgress) {
      acetate.log.info('build', 'all ready building, queuing build after current build');
      acetate.on('build', build);
      return;
    }

    inProgress = true;
    acetate.log.time('build');
    acetate.log.verbose('build', 'starting build');
    warnings = [];
    errors = [];
    async.series([
      runExtensions,
      buildPages
    ], function () {
      inProgress = false;
      var status = buildStatus();
      acetate.log[status]('build', 'done in %s with %d errors and %d warnings', acetate.log.timeEnd('build'), errors.length, warnings.length);

      if (callback) {
        callback();
      }

      acetate.emit('build', {
        status: status,
        errors: errors,
        warnings: warnings
      });
    });
  };

  var buildPages = function (callback) {
    acetate.log.verbose('build', 'building pages');
    async.each(acetate.pages, function (page, cb) {
      page._build(cb);
    }, callback);
  };

  var runExtensions = function (callback) {
    acetate.log.verbose('extension', 'running extensions');

    var extensions = acetate._extensions.slice(0);

    var checkForExtensions = function () {
      return extensions.length;
    };

    var runNextExtension = function (cb) {
      acetate.log.time('extension');
      var extension = extensions.shift();
      extension(acetate, function (error, acetate) {
        acetate.log.debug('extension', 'extension finished in %s', acetate.log.timeEnd('extension'));
        cb(error, acetate);
      });
    };

    async.whilst(checkForExtensions, runNextExtension, function (error) {
      if (!error) {
        callback();
      } else {
        acetate.log.error('extensions', 'error running extensions %s', error);
      }
    });
  };

  var warn = function (message) {
    warnings.push(message);
  };

  var error = function (message) {
    errors.push(message);
  };

  var buildStatus = function () {
    if (errors.length) {
      return 'error';
    }

    if (warnings.length) {
      return 'warn';
    }

    return 'success';
  };

  return {
    warn: warn,
    error: error,
    build: build,
    runExtensions: runExtensions
  };
};
