const path = require("path");
const errorUtils = require("./utils");

module.exports = class AcetateConfigError extends Error {
  constructor(error, root) {
    let [file, line, column] = error.stack
      .split("\n")[0]
      .replace(/^.+Error:\s+/, "")
      .split(":");
    let errorLocation = {
      file,
      line,
      column
    };

    if (!errorLocation.line) {
      errorLocation = errorUtils.processStacktrace(error.stack);
    }

    errorLocation.file = errorLocation.file.replace(root + path.sep, "");

    super(
      `${error.message} at ${errorUtils.formatErrorLocation(
        errorLocation.file,
        errorLocation.line,
        errorLocation.column
      )}`
    );

    this.name = "AcetateConfigError";
    this.file = file;
    this.line = line;
    this.column = column;
    this.stack = error.stack;
  }
};
