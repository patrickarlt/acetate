var util = require('util');
var path = require('path');
var fs = require('fs');
var normalizeNewline = require('normalize-newline');

function utils (options) {
  function parseException (e) {
    var components = normalizeNewline(e.stack).split('\n')[1] // first line of the stacktrace
                            .split(' ') // split by spaces (' ')
                            .pop() // pop the last word off
                            .replace(/[\(|\)]/g, '') // replace parens
                            .split(':'); // split on : to seperate path:line:col

    var colNo = parseInt(components.pop(), 10);
    var lineNo = parseInt(components.pop(), 10);
    var errorPath = components.join(':').replace(options.root + path.sep, '');

    return {
      message: normalizeNewline(e.message).split('\n')[0],
      path: errorPath,
      lineNo: lineNo,
      colNo: colNo
    };
  };

  function formatException (error) {
    var e = parseException(error);

    return util.format('%s - %s:%d:%d', e.message, e.path, e.lineNo, e.colNo);
  }

  function exists (filepath) {
    var doesExist = true;

    if (fs.accessSync) {
      try {
        fs.accessSync(filepath);
      } catch (e) {
        doesExist = false;
      }
    } else {
      doesExist = fs.existsSync(filepath);
    }

    return doesExist;
  }

  return {
    formatException: formatException,
    parseException: parseException,
    exists: exists
  };
}

module.exports = utils;
