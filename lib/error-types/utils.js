const path = require('path');

function processStacktrace (stacktrace) {
  const lines = stacktrace.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let match = line.match(/^\s+.+?\/(.+?):(\d+):(\d+)/);
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

function toJSON (error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    file: error.file,
    line: error.line,
    column: error.column
  };
}

module.exports = {
  processStacktrace,
  formatErrorLocation,
  toJSON
};
