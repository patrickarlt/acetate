const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const glob = require("glob");
const nunjucks = require("nunjucks");
const normalizeNewline = require("normalize-newline");

const TemplateNotFoundError = require("./error-types/TemplateNotFoundError.js");

module.exports = nunjucks.Loader.extend({
  init: function({ sourceDir, logger, errorHandler }) {
    this.sourceDir = sourceDir;
    this.log = logger;
    this.errorHandler = errorHandler;
  },

  getSource: function(name) {
    this.log.debug(`looking up templates ${name}, ${name}.md, ${name}.html`);

    const matches = glob.sync(`${name}?(.html|.md|)`, {
      cwd: this.sourceDir
    });

    if (!matches || !matches.length) {
      throw new TemplateNotFoundError(name);
    }

    if (matches.length > 1) {
      this.log.warn(
        `Found multiple templates matching ${name}. ${matches.join(",")}`
      );
    }

    const fullpath = path.join(
      this.sourceDir,
      matches.sort((a, b) => a.length - b.length)[0]
    );

    const content = fs.readFileSync(fullpath, "utf8");

    const template = _.trim(_.last(content.split(/^([\s\S]+)^-{3}$/m)));

    return {
      src: normalizeNewline(template),
      path: fullpath
    };
  }
});
