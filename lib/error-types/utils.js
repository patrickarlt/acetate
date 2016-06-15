const path = require('path');
const normalizeNewline = require('normalize-newline');
const { trim } = require('lodash');

const STACKTRACE_REGEX = /^.+?\(?\/(.+?):(\d+):(\d+)\)?/;

function processStacktrace (stacktrace) {
  const lines = normalizeNewline(stacktrace).split(/\n/);

  for (let i = 0; i < lines.length; i++) {
    let line = trim(lines[i]);

    if (STACKTRACE_REGEX.test(line)) {
      let match = line.match(STACKTRACE_REGEX);
      return {
        file: (path.sep + match[1]).replace(process.cwd() + path.sep, ''),
        line: parseInt(match[2]),
        column: parseInt(match[3])
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
