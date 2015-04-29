var path = require('path');

var dataLoader = require('../extensions/data-loader');
var statsInjector = require('../extensions/stats');
var prettyUrls = require('../extensions/pretty-urls');
var relativeUrls = require('../extensions/relative-path');

module.exports = function (acetate) {
  function init () {
    acetate.verbose('intialize', 'starting with options: %j', acetate.options);

    if (require.cache[acetate.config]) {
      delete require.cache[acetate.config];
    }

    if (acetate.config) {
      try {
        require(path.join(acetate.root, acetate.config))(acetate);
      } catch (e) {
        acetate.error('config', 'error in config file - %s', acetate.util.formatException(e));
      }
    }

    acetate.use([
      prettyUrls,
      statsInjector,
      relativeUrls,
      dataLoader
    ]);

    acetate.time('load');

    acetate.load(function () {
      acetate.info('loader', 'loaded %d pages in %s', acetate.pages.length, acetate.timeEnd('load'));
      acetate.build(function () {
        if (acetate.options.server || acetate.options.watcher) {
          acetate.startWatcher();
        }

        if (acetate.options.server) {
          acetate.startServer(acetate.options);
        }
      });
    });
  }

  return {
    init: init
  };
};
