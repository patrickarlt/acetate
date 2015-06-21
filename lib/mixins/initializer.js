var path = require('path');

var dataLoader = require('../extensions/data-loader');
var statsInjector = require('../extensions/stats');
var prettyUrls = require('../extensions/pretty-urls');
var relativePath = require('../extensions/relative-path');

module.exports = function (acetate) {
  var configPath = path.join(acetate.root, acetate.config);

  function init () {
    acetate.verbose('intialize', 'starting with options: %j', acetate.options);

    if (require.cache[configPath]) {
      delete require.cache[configPath];
    }

    if (acetate.config && acetate.util.exists(configPath)) {
      try {
        require(configPath)(acetate);
      } catch (e) {
        acetate.error('config', 'error in config file - %s', acetate.util.formatException(e));
      }
    }

    acetate.use([
      statsInjector,
      prettyUrls,
      relativePath,
      dataLoader
    ]);

    acetate.emit('ready');

    acetate.load();
  }

  return {
    init: init
  };
};
