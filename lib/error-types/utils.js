const path = require('path');
const normalizeNewline = require('normalize-newline');

function processStacktrace (stacktrace) {
  const lines = normalizeNewline(stacktrace).split(/\n/);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let match = line.match(/^\s+.+?\(?(.+?):(\d+):(\d+)\)?/);
    if (match) {
      return {
        file: (path.sep + match[1]).replace(process.cwd() + path.sep, ''),
        line: parseInt(match[2]),
        column: parseInt(match[3])
      };
    }
  }

  return null;
}

function formatErrorLocation (file, line, column) {
  return file + ((line) ? `(${line}${(column) ? `:${column}` : ''})` : '');
}

module.exports = {
  processStacktrace,
  formatErrorLocation
};
