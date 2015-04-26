var chokidar = require('chokidar');
var path = require('path');
var _ = require('lodash');

module.exports = function (acetate) {
  var watcher;

  var start = function () {
    acetate.info('watcher', 'starting file watcher');

    if (watcher) {
      watcher.close();
    }

    watcher = chokidar.watch(acetate.sources, {
      ignoreInitial: true
    });

    watcher.on('change', changed);
    watcher.on('add', added);
    watcher.on('unlink', deleted);
  };

  var changed = function (filepath) {
    acetate.info('watcher', '%s changed', filepath.replace(process.cwd() + path.sep, ''));
    invalidateNunjucksCache(filepath);
    removeOldPage(filepath);
    loadNewPage(filepath);
  };

  var deleted = function (filepath) {
    acetate.info('watcher', '%s deleted', filepath.replace(process.cwd() + path.sep, ''));
    invalidateNunjucksCache(filepath);
    removeOldPage(filepath);
  };

  var added = function (filepath) {
    acetate.info('watcher', '%s added', filepath.replace(process.cwd() + path.sep, ''));
    loadNewPage(filepath);
  };

  var removeOldPage = function (filepath) {
    var page = _.remove(acetate.pages, {fullpath: filepath})[0];

    if (page) {
      acetate.verbose('watcher', 'removing %s', page.dest);
      page.clean();
    }
  };

  var loadNewPage = function (filepath) {
    var relativepath = filepath.replace(process.cwd() + path.sep, '');
    if (path.basename(filepath)[0] === '_') {
      acetate.info('watcher', 'layout or partial changed rebuilding all pages');
      _.each(acetate.pages, function (page) {
        page.dirty = true;
      });
      acetate.build();
    } else {
      acetate.loadPage(filepath, function (error, page) {
        if (error) {
          acetate('watcher', 'error loading %s - %s', error);
        }
        acetate.info('watcher', 'rebuilding %s', relativepath);
        acetate.pages.push(page);
        acetate.build();
      });
    }
  };

  var invalidateNunjucksCache = function (filepath) {
    var name = filepath.replace(path.join(acetate.root, acetate.src) + path.sep, '').replace(path.extname(filepath), '');
    acetate.debug('nunjucks', 'clearing %s from the template cache', name);
    acetate.nunjucks.loaders[0].emit('update', name);
  };

  var stop = function () {
    watcher.close();
  };

  return {
    startWatcher: start,
    stopWatcher: stop
  };
};
