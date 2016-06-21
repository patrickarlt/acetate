const errorUtils = require('./utils');

module.exports = class TransformerError extends Error {
  constructor (error) {
    error = (typeof error === 'string') ? new Error(error) : error;

    let {file, line, column} = errorUtils.processStacktrace(error.stack);

    if (file && line && column) {
      let errorLocation = errorUtils.formatErrorLocation(file, line, column);
      super(`${error.name} ${error.message} at ${errorLocation}`);
    } else {
      super(`${error.name} ${error.message}`);
    }

    this.name = 'TransformerError';
    this.line = line;
    this.column = column;
    this.file = file;
    this.stack = error.stack;
  }

  toString () {
    return `${this.name}: ${this.message}`;
  }
};
