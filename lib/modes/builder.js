const fs = require('fs');
const path = require('path');
const promisify = require('es6-promisify');
const mkdirp = promisify(require('mkdirp'));
const writeFile = promisify(fs.writeFile);
const async = require('async');

module.exports = function build (acetate) {
  const _buildTimer = acetate.time();

  function filter (page) {
    return !page.ignore;
  }

  return acetate.loader.loadPages()
    .then(function (pages) {
      return acetate.transformer.transformPages(pages);
    })
    .then(function (pages) {
      return pages.filter(filter);
    })
    .then(function (pages) {
      return new Promise(function (resolve, reject) {
        const buildQueue = async.queue(function (page, callback) {
          const outputPath = path.join(acetate.outDir, page.dest);
          const outputDirectory = path.join(acetate.outDir, path.dirname(page.dest));

          return mkdirp(outputDirectory)
            .then(() => acetate.renderer.renderPage(page))
            .then((output) => writeFile(outputPath, output))
            .then(callback)
            .catch(e => acetate.error(e));
        }, 1);

        buildQueue.drain = function () {
          resolve(pages);
        };

        buildQueue.push(pages);
      });
    })
    .then(function (pages) {
      acetate.success(`Built ${pages.length} page in ${acetate.timeEnd(_buildTimer)}`);
    });
};
