const { buildPages } = require('./utils.js');

module.exports = function build (acetate) {
  const _buildTimer = acetate.time();

  function filter (page) {
    return !page.ignore;
  }

  function logger (page, time) {
    acetate.info(`Built ${page.src} (${page.url}) to ${page.dest} in ${time}`);
  }

  return buildPages(acetate, filter, logger)
    .then(function () {
      acetate.success(`Build complete in ${acetate.timeEnd(_buildTimer)}`);
    });
};
