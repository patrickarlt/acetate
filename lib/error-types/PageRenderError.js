const errorUtils = require("./utils");
const _ = require("lodash");
const path = require("path");

module.exports = class PageRenderError extends Error {
  constructor(error, page) {
    error = typeof error === "string" ? new Error(error) : error;
    let originalMessage = _.trim(_.last(error.message.split("\n")));
    if (/ \[(Line) \d+, Column \d+\]/.test(error.message)) {
      let originalErrorLocation = error.message.match(/.*: \((.*)\)/);
      let file = originalErrorLocation
        ? path.basename(originalErrorLocation[1])
        : page.src;
      let line =
        parseInt(error.message.match(/Line (\d+)/)[1], 10) +
        (page.__templateErrorOffset || 0);
      let column = parseInt(error.message.match(/Column (\d+)/)[1], 10);
      super(
        `${originalMessage} while rendering ${errorUtils.formatErrorLocation(
          file || page.src,
          line,
          column
        )}`
      );
      this.line = line;
      this.column = column;
      this.file = file || page.src;
    } else {
      super(`${originalMessage} while rendering ${page.src}`);
      this.line = null;
      this.column = null;
      this.file = page.src;
    }

    this.stack = error.stack;
    this.name = "PageRenderError";
  }
};
