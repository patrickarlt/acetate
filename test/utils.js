var path = require('path');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');
var util = require('util');
var path = require('path');
var acetate = require('../index.js');
var rimraf = require('rimraf');

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

      var actualContent = results.actual.toString();
      var expectedContent = results.expected.toString();
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
