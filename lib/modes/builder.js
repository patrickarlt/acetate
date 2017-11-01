const fs = require("fs");
const path = require("path");
const promisify = require("es6-promisify");
const mkdirp = promisify(require("mkdirp"));
const writeFile = promisify(fs.writeFile);
const async = require("async");

module.exports = function build(acetate) {
  const _buildTimer = acetate.log.time();

  return acetate
    .getPages()
    .then(pages => pages.filter(p => !p.ignore))
    .then(function(pages) {
      return new Promise(function(resolve, reject) {
        const buildQueue = async.queue(function(page, callback) {
          return acetate.transformPage(page)
            .then(page => acetate.renderPage(page))
            .then(output => writeFile(outputPath, output))
            .then(callback)
            .catch(e => {
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
    });
};
