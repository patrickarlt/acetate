var async = require('async');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var util = require('util');
var acetate = require('../index.js');
var rimraf = require('rimraf');
var normalizeNewline = require('normalize-newline');

module.exports = {
  equal: function (test, root, actual, expected, callback) {
    async.parallel({
      actual: _.partial(fs.readFile, path.join(root, actual)),
      expected: _.partial(fs.readFile, path.join(root, expected))
    }, function (error, results) {
      if (error) {
        console.log(error);
        test.fail();
        return;
      }

      var actualContent = normalizeNewline(results.actual.toString());
      var expectedContent = normalizeNewline(results.expected.toString());
      var message = util.format('expected "%s" (%s) to equal "%s" (%s)', actualContent, actual, expectedContent, expected);

      test.equal(actualContent, expectedContent, message);

      if (callback) {
        callback();
      }
    });
  },

  start: function (options, callback) {
    rimraf(path.join(options.root, options.dest || 'build'), function (error) {
      if (error) {
        console.log(error);
        process.exit(1);
      }

      callback(acetate(options));
    });
  }
};
