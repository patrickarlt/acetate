var async = require('async');
var _ = require('lodash');

module.exports = function (acetate) {
  var inProgress;
  var extensions = [];
  var pendingExtensions;
  var runningExtensions;

  function use (ext) {
    ext = _.isArray(ext) ? ext : [ext];

    for (var i = 0; i < ext.length; i++) {
      if (inProgress || runningExtensions) {
        pendingExtensions.unshift(ext[i]);
      } else {
        extensions.push(ext[i]);
      }
    }
  }

  function build (callback) {
    if (inProgress) {
      acetate.info('build', 'all ready building, queuing build after current build');
      acetate.on('build', function () {
        build(callback);
      });
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
        callback(errors, warnings, status);
      }

      acetate.removeListener('log', logger);

      acetate.emit('build', {
        status: status,
        errors: errors,
        warnings: warnings
      });
    });
  }

  function buildPages (callback) {
    acetate.verbose('build', 'building pages');
    async.each(acetate.pages, function (page, cb) {
      page.build(cb);
    }, callback);
  }

  function runExtensions (callback) {
    if (runningExtensions) {
      acetate.info('extensions', 'already running extensions, queuing');
      acetate.on('build', function () {
        runExtensions(callback);
      });
      return;
    }

    acetate.verbose('extension', 'running extensions');
    acetate.time('extensions');

    pendingExtensions = extensions.slice(0);

    var checkForExtensions = function () {
      return pendingExtensions.length;
    };

    var runNextExtension = function (cb) {
      acetate.time('extension');
      var currentExtension = pendingExtensions.shift();
      currentExtension(acetate, function (error, acetate) {
        acetate.debug('extension', 'extension %s finished in %s', (currentExtension.name || 'unnamed'), acetate.timeEnd('extension'));
        cb(error, acetate);
      });
    };

    runningExtensions = true;

    async.whilst(checkForExtensions, runNextExtension, function (error) {
      acetate.info('extensions', 'extensions finished running in %s', acetate.timeEnd('extensions'));

      runningExtensions = false;

      if (error) {
        acetate.error('extensions', 'error running extensions %s', error);
      }

      callback();
    });
  }

  return {
    use: use,
    extensions: extensions,
    build: build,
    runExtensions: runExtensions
  };
};