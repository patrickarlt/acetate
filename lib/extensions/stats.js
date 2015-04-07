var async = require('async');
var fs = require('fs');
var path = require('path');

module.exports = function (acetate, callback){
  acetate.log.verbose('extension', 'adding file stats to each page');

  async.each(acetate.pages, function (page, cb){
    fs.stat(page.fullpath, function(error, stats){
      page.stats = stats;
      cb(error);
    });
  }, callback);
};