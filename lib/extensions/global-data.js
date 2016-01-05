var path = require('path');

// define a global data source
module.exports = function globalData (name, source) {
  return function (acetate, callback) {
    acetate._data = acetate._data || {};

    acetate._data[source] = {
      global: name,
      fullpath: path.join(acetate.src, source),
      using: [],
      locals: []
    };

    callback(undefined, acetate);
  };
};
