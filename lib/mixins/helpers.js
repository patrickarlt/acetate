var metadataInjector = require('../extensions/metadata');
var queryBuilder = require('../extensions/query');
var pageTransform = require('../extensions/transform');
var globalData = require('../extensions/global-data');

module.exports = function (acetate) {
  function metadata (pattern, data) {
    acetate.use(metadataInjector(pattern, data));
  };

  function ignore (pattern) {
    acetate.use(metadataInjector(pattern, {
      ignore: true
    }));
  };

  function layout (pattern, layout) {
    acetate.use(metadataInjector(pattern, {
      layout: layout
    }));
  };

  function query (name, glob, builder) {
    acetate.use(queryBuilder(name, glob, builder));
  };

  function transform (glob, builder) {
    acetate.use(pageTransform(glob, builder));
  };

  function data (name, filepath) {
    acetate.use(globalData(name, filepath));
  };

  return {
    layout: layout,
    metadata: metadata,
    ignore: ignore,
    data: data,
    transform: transform,
    query: query
  };
};
