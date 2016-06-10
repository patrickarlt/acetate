const fs = require('fs');
const path = require('path');
const promisify = require('es6-promisify');
const mkdirp = promisify(require('mkdirp'));
const writeFile = promisify(fs.writeFile);

module.exports = function build (acetate) {
  const _buildTimer = acetate.time();

  function transformPages (pages) {
    return acetate.transformer.transformPages(pages);
  }

  function renderPages (pages) {
    pages = pages.filter(page => !page.ignore);

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
        acetate.info(`Built ${page.src} (${page.url}) to ${page.dest} in ${acetate.timeEnd(_timer)}`);
      });
    }));
  }

  return acetate.loader.loadPages()
    .then(transformPages)
    .then(renderPages)
    .then(writeResults)
    .then(function () {
      acetate.success(`Build complete in ${acetate.timeEnd(_buildTimer)}`);
    })
    .catch(function (error) {
      acetate.error(error);
    });
};
