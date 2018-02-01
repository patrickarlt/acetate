const fs = require("fs");
const path = require("path");
const promisify = require("es6-promisify");
const mkdirp = promisify(require("mkdirp"));
const writeFile = promisify(fs.writeFile);

function renderPages(acetate, pages) {
  return Promise.all(
    pages.map(page => {
      const outputDirectory = path.join(
        acetate.outDir,
        path.dirname(page.dest)
      );

      return Promise.all([
        Promise.resolve(page),
        acetate.renderer.renderPage(page),
        mkdirp(outputDirectory)
      ]);
    })
  );
}

function writeResults(acetate, results, handler) {
  return Promise.all(
    results.map(result => {
      var _timer = acetate.time();
      const [page, output] = result;
      const outputPath = path.join(acetate.outDir, page.dest);
      return writeFile(outputPath, output).then(function() {
        handler(page, acetate.timeEnd(_timer));
      });
    })
  );
}

function buildPages(acetate, filter, logger) {
  return acetate.loader
    .loadPages()
    .then(function(pages) {
      return acetate.transformer.transformPages(pages);
    })
    .then(function(pages) {
      return pages.filter(filter);
    })
    .then(function(pages) {
      return renderPages(acetate, pages);
    })
    .then(function(results) {
      return writeResults(acetate, results, logger);
    });
}

module.exports = {
  renderPages,
  writeResults,
  buildPages
};
