var path = require('path');
var fs = require('fs');

var dataLoader = require('../extensions/data-loader');
var statsInjector = require('../extensions/stats');
var prettyUrls = require('../extensions/pretty-urls');
var relativePath = require('../extensions/relative-path');

module.exports = function (acetate) {
  var configPath = path.join(acetate.root, acetate.config);

  function exists (filepath) {
    var doesExist = true;

    try {
      fs.accessSync(configPath);
    } catch (e) {
      doesExist = false;
    }

    return doesExist;
  };

  function init () {
    acetate.verbose('intialize', 'starting with options: %j', acetate.options);

    if (require.cache[acetate.config]) {
      delete require.cache[acetate.config];
    }
    console.log(exists(configPath));
    if (acetate.config && exists(configPath)) {
      try {
        require(configPath)(acetate);
      } catch (e) {
        acetate.error('config', 'error in config file - %s', acetate.util.formatException(e));
      }
    }

    acetate.use([
      statsInjector,
      relativePath,
      prettyUrls,
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
