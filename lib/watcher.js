const fs = require('fs');
const path = require('path');
const promisify = require('es6-promisify');
const mkdirp = promisify(require('mkdirp'));
const writeFile = promisify(fs.writeFile);
const deleteFile = promisify(fs.unlink);

module.exports = function createWatcher (acetate) {
  function transformPages (pages) {
    return acetate.transformer.transformPages(pages);
  }

  function renderPages (pages) {
    return Promise.all(pages.map(page => {
      const outputDirectory = path.join(acetate.outDir, path.dirname(page.dest));

      return Promise.all([
        Promise.resolve(page),
        acetate.renderer.renderPage(page),
        mkdirp(outputDirectory)
      ]);
    }));
  }

  function writeResults (results) {
    return Promise.all(results.map(result => {
      var _timer = acetate.time();
      const [page, output] = result;
      const outputPath = path.join(acetate.outDir, page.dest);
      return writeFile(outputPath, output).then(() => {
        if (page.ignore) {
          acetate.warn(`Page ${page.src} is ignored but watcher will still process and build it`);
        }
        acetate.info(`Built ${page.src} (${page.url}) to ${page.dest} in ${acetate.timeEnd(_timer)}`);
      });
    }));
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
    const _buildTimer = acetate.time();
    acetate.loader.loadPages()
      .then(transformPages)
      .then(pages => {
        return pages.filter(page => page.src === changedPage.src);
      })
      .then(renderPages)
      .then(writeResults)
      .then(function () {
        acetate.success(`Build complete in ${acetate.timeEnd(_buildTimer)}`);
      })
      .catch(function (error) {
        acetate.error(error);
      });
  }

  function buildAllPages () {
    const _buildTimer = acetate.time();
    acetate.loader.loadPages()
      .then(transformPages)
      .then(renderPages)
      .then(writeResults)
      .then(function () {
        acetate.success(`Build complete in ${acetate.timeEnd(_buildTimer)}`);
      })
      .catch(function (error) {
        acetate.error(error);
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
