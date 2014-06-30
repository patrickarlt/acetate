var async = require('async');
var fs = require('fs');
var path = require('path');

module.exports = function (press, callback){
  async.each(press.pages, function (page, cb){
    fs.stat(path.join(press.config.src, page.src), function(error, stats){
      page.stats = stats;
      cb(error);
    });
  }, callback);
};