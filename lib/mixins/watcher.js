var chokidar = require('chokidar');
var path = require('path');
var _ = require('lodash');

module.exports = function (acetate) {
  function start () {
    acetate.info('watcher', 'starting file watcher');

    acetate._watcher = chokidar.watch(acetate.sources, {
      ignoreInitial: true
    });

    acetate._watcher.on('change', changed);
    acetate._watcher.on('add', added);
    acetate._watcher.on('unlink', deleted);
    acetate._watcher.on('ready', function () {
      acetate.emit('watcher:ready');
    });

    acetate.emit('watcher:start');
  }

  function changed (filepath) {
    acetate.info('watcher', '%s changed', filepath.replace(process.cwd() + path.sep, ''));
    invalidateNunjucksCache(filepath);
    removeOldPage(filepath);
    loadNewPage(filepath);
  }

  function deleted (filepath) {
    acetate.info('watcher', '%s deleted', filepath.replace(process.cwd() + path.sep, ''));
    invalidateNunjucksCache(filepath);
    removeOldPage(filepath);
  }

  function added (filepath) {
    acetate.info('watcher', '%s added', filepath.replace(process.cwd() + path.sep, ''));
    loadNewPage(filepath);
  }

  function removeOldPage (filepath) {
    var page = _.remove(acetate.pages, {fullpath: filepath})[0];

    if (page) {
      acetate.verbose('watcher', 'removing %s', page.dest);
      page.clean(function (error) {
        if (error) {
          acetate.error('watcher', 'error deleting %s - %s', page.dest, error);
        }
      });
    }
  }

  function loadNewPage (filepath) {
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
          return;
        }
        acetate.info('watcher', 'rebuilding %s', relativepath);
        acetate.pages.push(page);
        acetate.build();
      });
    }
  }

  function invalidateNunjucksCache (filepath) {
    var name = filepath.replace(path.join(acetate.root, acetate.src) + path.sep, '').replace(path.extname(filepath), '');
    acetate.debug('nunjucks', 'clearing %s from the template cache', name);
    acetate.nunjucks.loaders[0].emit('update', name);
  }

  function stop () {
    if (acetate._watcher) {
      acetate._watcher.close();
      acetate._watcher = undefined;
    }

    acetate.info('watcher', 'stopping watcher');
    acetate.emit('watcher:stop');
  }

  return {
    startWatcher: start,
    stopWatcher: stop
  };
};
