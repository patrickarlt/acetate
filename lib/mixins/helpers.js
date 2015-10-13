var metadataInjector = require('../extensions/metadata');
var queryBuilder = require('../extensions/query');
var pageTransform = require('../extensions/transform');
var globalData = require('../extensions/global-data');
var outputGenerator = require('../extensions/output');
var debugPages = require('../extensions/debug');

module.exports = function (acetate) {
  function metadata (pattern, data) {
    acetate.use(metadataInjector(pattern, data));
  }

  function ignore (pattern) {
    metadata(pattern, {
      ignore: true
    });
  }

  function layout (pattern, layout) {
    metadata(pattern, {
      layout: layout
    });
  }

  function query (name, glob, builder) {
    acetate.use(queryBuilder(name, glob, builder));
  }

  function transform (glob, builder) {
    acetate.use(pageTransform(glob, builder));
  }

  function data (name, filepath) {
    acetate.use(globalData(name, filepath));
  }

  function output (pages) {
    acetate.use(outputGenerator(pages));
  }

  function debug (glob) {
    acetate.use(debugPages(glob));
  }

  return {
    layout: layout,
    metadata: metadata,
    ignore: ignore,
    data: data,
    transform: transform,
    query: query,
    output: output,
    debug: debug
  };
};
