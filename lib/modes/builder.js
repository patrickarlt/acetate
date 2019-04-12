const fs = require("fs");
const path = require("path");
const promisify = require("es6-promisify");
const mkdirp = promisify(require("mkdirp"));
const writeFile = promisify(fs.writeFile);
const async = require("async");

module.exports = function build(acetate, { strict }) {
  const _buildTimer = acetate.log.time();

  return acetate
    .getPages()
    .then(function(pages) {
      return new Promise(function(resolve, reject) {
        const buildQueue = async.queue(function(page, callback) {
          return acetate
            .transformPage(page)
            .then(finalPage => {
              if (finalPage.ignore) {
                return Promise.resolve();
              } else {
                const outputPath = path.join(acetate.outDir, finalPage.dest);
                const outputDirectory = path.join(
                  acetate.outDir,
                  path.dirname(finalPage.dest)
                );

                return mkdirp(outputDirectory)
                  .then(() => acetate.renderPage(finalPage))
                  .then(content => {
                    return writeFile(outputPath, content);
                  });
              }
            })
            .then(callback)
            .catch(e => {
              acetate.log.error(`Error building ${page.src}`, e);
              buildQueue.kill();
              callback(e, null);
              reject(e);
            });
        }, 5);

        buildQueue.drain = function() {
          resolve(pages);
        };

        buildQueue.push(pages);
      });
    })
    .then(function(pages) {
      acetate.log.success(
        `Built ${pages.length} page in ${acetate.log.timeEnd(_buildTimer)}`
      );
    })
    .catch(e => {
      if (strict) {
        process.exit(0);
      }
    });
};
