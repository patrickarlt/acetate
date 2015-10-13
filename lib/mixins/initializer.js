var dataLoader = require('../extensions/data-loader');
var statsInjector = require('../extensions/stats');
var prettyUrls = require('../extensions/pretty-urls');
var relativePath = require('../extensions/relative-path');

module.exports = function (acetate) {
  function init () {
    acetate.verbose('intialize', 'starting with options: %j', acetate.options);

    if (require.cache[acetate.config]) {
      delete require.cache[acetate.config];
    }

    if (acetate.config && acetate.util.exists(acetate.config)) {
      try {
        require(acetate.config)(acetate);
      } catch (e) {
        acetate.error('config', 'error in config file - %s', acetate.util.formatException(e));
      }
    }

    acetate.source('**/*.+(md|markdown|html)');

    acetate.use([
      statsInjector,
      prettyUrls,
      relativePath,
      dataLoader
    ]);

    acetate.emit('ready');
  }

  return {
    init: init
  };
};
