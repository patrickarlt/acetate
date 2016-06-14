const fs = require('fs');
const path = require('path');
const promisify = require('es6-promisify');
const deleteFile = promisify(fs.unlink);
const {buildPages} = require('./utils.js');

module.exports = function createWatcher (acetate) {
  function logger (page, time) {
    if (page.ignore) {
      acetate.warn(`Page ${page.src} is ignored but watcher will still process and build it`);
    }
    acetate.info(`Built ${page.src} (${page.url}) to ${page.dest} in ${time}`);
  }

  function removePage (page) {
    const outputPath = path.join(acetate.outDir, page.dest);
    deleteFile(outputPath)
      .then(function () {
        acetate.info('Removed ${page.dest}');
      })
      .catch(function (error) {
        acetate.error(error);
      });
  }

  function buildPage (changedPage) {
    console.log(changedPage);
    function filter (page) {
      return page.src === changedPage.src;
    }

    return buildPages(acetate, filter, logger).catch(function (error) {
      acetate.error(error);
      acetate.error(error.stack);
    });
  }

  function buildAllPages () {
    function filter (page) {
      return true;
    }

    return buildPages(acetate, filter, logger).catch(function (error) {
      acetate.error(error);
      acetate.error(error.stack);
    });
  }

  acetate.on('watcher:add', buildPage);
  acetate.on('watcher:change', buildPage);
  acetate.on('watcher:delete', removePage);
  acetate.on('watcher:template:add', buildAllPages);
  acetate.on('watcher:template:change', buildAllPages);
  acetate.on('watcher:template:delete', buildAllPages);
  acetate.on('config:loaded', buildAllPages);

  acetate.startWatcher();

  buildAllPages();

  return {
    stop: function () {
      acetate.stopWatcher();
    }
  };
};
