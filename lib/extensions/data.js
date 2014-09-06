var _ = require('lodash');

module.exports = function (acetate, callback){
  _.each(acetate.pages, function(page){
    _.each(page.data, function(data){
      page[data] = acetate.data[data];
    });
  });
  callback(undefined, acetate);
};