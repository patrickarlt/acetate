const errorUtils = require('./utils');
const _ = require('lodash');

module.exports = class PageRenderError extends Error {
  constructor (error, page) {
    error = (typeof error === 'string') ? new Error(error) : error;
    let originalMessage = _.trim(_.last(error.message.split('\n')));

    if (error._acetateError) {
      super(`${originalMessage} while rendering ${page.src}`);
      let {file, line, column} = errorUtils.processStacktrace(error.stack);
      this.file = file;
      this.line = line;
      this.column = column;
    } else {
      let line = error.lineno + page.__templateErrorOffset;
      let column = error.colno;
      super(`${originalMessage} while rendering ${errorUtils.formatErrorLocation(page.src, line, column)}`);
      this.line = line;
      this.column = column;
      this.file = page.src;
    }

    this.stack = error.stack;
    this.name = 'PageRenderError';
  }

  toJSON () {
    return errorUtils.toJSON(this);
  }
};
