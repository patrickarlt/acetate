var _ = require('lodash');

module.exports = function (press, callback){
  _.each(press.pages, function(page){
    _.each(page.data, function(data){
      page[data] = press.data[data];
    });
  });
  callback(undefined, press);
};