var Acetate = require('./lib/acetate');

module.exports = function (options) {
  var site = new Acetate().init(options);

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
