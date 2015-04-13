var path = require('path');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');
var util = require('util');

module.exports = {
  equal: function (test, root, actual, expected){
    async.parallel({
      actual: _.partial(fs.readFile, path.join(root, actual)),
      expected: _.partial(fs.readFile, path.join(root, expected))
    }, function(error, results){
      var actualContent = results.actual.toString();
      var expectedContent = results.expected.toString();
      var message = util.format('expected "%s" (%s) to equal "%s" (%s)', actualContent, actual, expectedContent, expected);
      test.equal(actualContent, expectedContent, message);
    });
  }
};