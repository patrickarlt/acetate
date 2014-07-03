var _ = require('lodash');

module.exports = function (press, callback){
  _.each(press.pages, function(page){
    _.each(page.collections, function(collection){
      page[collection] = press.collections[collection];
    });
  });
  callback(undefined, press);
};