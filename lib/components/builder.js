var async = require('async');

module.exports = function (acetate) {
  var status = 'success';

  var build = function (callback) {
    acetate.log.time('build');
    acetate.log.verbose('build', 'starting build');
    status = 'success';
    async.series([
      runExtensions,
      buildPages
    ], function (error) {
      if (buildStatus() === 'error') {
        acetate.log.error('build', 'done in %s with errors', acetate.log.timeEnd('build'));
      } else if (buildStatus() === 'warn') {
        acetate.log.warn('build', 'done in %s with warnings', acetate.log.timeEnd('build'));
      } else {
        acetate.log.success('build', 'done in %s', acetate.log.timeEnd('build'));
      }

      if (callback) {
        callback(acetate._buildError);
      }

      acetate.emit('build', {
        status: buildStatus() || 'success'
      });
    });
  };

  var buildStatus = function (update) {
    if (!update) {
      return status;
    }

    if (update === 'error') {
      status = 'error';
    }

    if (update === 'warn' && !status) {
      status = 'warn';
    }
  };

  var buildPages = function (callback) {
    acetate.log.verbose('build', 'building pages');
    async.each(acetate.pages, function (page, callback) {
      page._build(callback);
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

  return {
    build: build,
    runExtensions: runExtensions,
    buildStatus: buildStatus
  };
};
