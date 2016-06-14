const errorUtils = require('./utils');

module.exports = class CustomHelperError extends Error {
  constructor (helperType, name, error) {
    error = (typeof error === 'string') ? new Error(error) : error;
    let {file, line, column} = errorUtils.processStacktrace(error.stack);
    let errorLocation = errorUtils.formatErrorLocation(file, line, column);
    super(`error in custom ${helperType} \`${name}\`: ${error.name} ${error.message} at ${errorLocation}`);
    this._acetateError = true;
    this.name = 'CustomHelperError';
    this.helperType = helperType;
    this.line = line;
    this.column = column;
    this.file = file;
    this.stack = error.stack;
  }
};
