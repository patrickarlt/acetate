const errorUtils = require('./utils');

module.exports = class MetadataParseError extends Error {
  constructor (error, src) {
    let line = error.mark.line;
    let column = error.mark.column;
    super(`${error.reason} at ${src}(${line}:${column})`);
    this.name = 'MetadataParseError';
    this.line = line;
    this.column = column;
    this.file = src;
    this.stack = error.stack;
  }

  toJSON () {
    return errorUtils.toJSON(this);
  }
};
