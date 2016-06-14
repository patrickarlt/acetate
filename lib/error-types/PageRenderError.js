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
    } else if ((/ \[(Line) \d+, Column \d+\]/).test(error.message)) {
      let file = error.message.match(/(.*): \((.*)\)/);
      let line = parseInt(error.message.match(/Line (\d+)/)[1], 10) + page.__templateErrorOffset;
      let column = parseInt(error.message.match(/Column (\d+)/)[1], 10);
      super(`${originalMessage} while rendering ${errorUtils.formatErrorLocation(page.src, line, column)}`);
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
    this.name = 'PageRenderError';
  }
};
