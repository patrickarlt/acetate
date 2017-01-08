const path = require('path');
const normalizeNewline = require('normalize-newline');
const { trim, isNaN } = require('lodash');

function processStacktrace (stacktrace) {
  const lines = normalizeNewline(stacktrace).split(/\n/);

  for (let i = 0; i < lines.length; i++) {
    let parsed = trim(lines[i]).replace(/[(|)]/g, ' ').split(':');
    let column = parseInt(parsed.pop(), 10);
    let line = parseInt(parsed.pop(), 10);
    let file = parsed.join(' ').split(' ').pop();

    if (!isNaN(line) && !isNaN(column)) {
      return {
        file: file.replace(process.cwd() + path.sep, ''),
        line: parseInt(line),
        column: parseInt(column)
      };
    }
  }

  return {};
}

function formatErrorLocation (file, line, column) {
  return file + ((line) ? `(${line}${(column) ? `:${column}` : ''})` : '');
}

module.exports = {
  processStacktrace,
  formatErrorLocation
};
