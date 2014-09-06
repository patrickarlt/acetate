var async = require('async');
var fs = require('fs');
var path = require('path');

module.exports = function (acetate, callback){
  async.each(acetate.pages, function (page, cb){
    fs.stat(path.join(acetate.src, page.src), function(error, stats){
      page.stats = stats;
      cb(error);
    });
  }, callback);
};