var Acetate = require('./lib/acetate');
var _ = require('lodash');

module.exports = function (options) {
  options = _.defaults(options, {
    config: 'acetate.conf.js',
    root: process.cwd(),
    watcher: false,
    server: false,
    host: 'localhost',
    port: 8000,
    findPort: false,
    clean: false,
    log: false
  });

  var site = new Acetate(options);

  function postBuild () {
    if (options.server || options.watcher) {
      site.watcher.start();
    }

    if (options.server) {
      site.server.start(options);
    }
  }

  site.log.time('load');

  site.load(function () {
    if (options.clean) {
      site.log.time('clean');
      site.clean(function (error) {
        if (error) {
          site.log.error('cleaning', 'error cleaning old pages %s', error);
        }
        site.log.verbose('cleaning', 'cleaning build folder done in %s', site.log.timeEnd('clean'));
        site.build(postBuild);
      });
    } else {
      site.build(postBuild);
    }
  });

  return site;
};
