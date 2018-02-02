const fs = require("fs");
const path = require("path");
const promisify = require("es6-promisify");
const deleteFile = promisify(fs.unlink);
const mkdirp = promisify(require("mkdirp"));
const writeFile = promisify(fs.writeFile);
const builder = require("./builder.js");

module.exports = function createWatcher(acetate) {
  function removePage(page) {
    const outputPath = path.join(acetate.outDir, page.dest);
    deleteFile(outputPath)
      .then(function() {
        acetate.info(`Removed ${page.dest}`);
      })
      .catch(acetate.error);
  }

  function buildPage(changedPage) {
    acetate
      .getPages()
      .then(pages => pages.find(p => p.src === changedPage.src))
      .then(page => {
        return Promise.all([
          Promise.resolve(page),
          mkdirp(path.join(acetate.outDir, path.dirname(page.dest)))
        ]);
      })
      .then(([page, dir]) => acetate.transformPage(page))
      .then(page => {
        return Promise.all([acetate.renderPage(page), Promise.resolve(page)]);
      })
      .then(([output, page]) =>
        writeFile(path.join(acetate.outDir, page.dest), output)
      )
      .catch(e => acetate.error(e));
  }

  function buildAllPages() {
    builder(acetate);
  }

  acetate.on("watcher:add", buildPage);
  acetate.on("watcher:change", buildPage);
  acetate.on("watcher:delete", removePage);
  acetate.on("watcher:template:add", buildAllPages);
  acetate.on("watcher:template:change", buildAllPages);
  acetate.on("watcher:template:delete", buildAllPages);
  acetate.on("config:loaded", buildAllPages);

  acetate.startWatcher();

  buildAllPages();

  return {
    stop: function() {
      acetate.stopWatcher();
    }
  };
};
