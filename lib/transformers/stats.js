const fs = require("fs");

module.exports = function(acetate) {
  acetate.transformAsync("**/*", function(page, done) {
    if (!page.templatePath) {
      process.nextTick(() => {
        done(null, page);
      });
      return;
    }

    fs.stat(page.templatePath, (error, stats) => {
      if (error) {
        done(error);
        return;
      }

      page.stats = stats;
      done(null, page);
    });
  });
};
