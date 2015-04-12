var path = require('path');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');
var acetate = require('../../lib/index.js');
var rimraf = require('rimraf');

module.exports = {
  equal: function (test, root, actual, expected){
    async.parallel({
      actual: _.partial(fs.readFile, path.join(root, actual)),
      expected: _.partial(fs.readFile, path.join(root, expected))
    }, function(error, results){
      test.equal(results.actual.toString(), results.expected.toString());
    });
  }
};