var util = require('util');
var path = require('path');
var fs = require('fs');

function utils (options) {
  function parseException (e) {
    var components = e.stack.split('\n')[1] // first line of the stacktrace
                            .split(' ') // split by spaces (' ')
                            .pop() // pop the last word off
                            .replace(/[\(|\)]/g, '') // replace parens
                            .split(':'); // split on : to seperate path:line:col
    var errorPath = components[0].replace(options.root + path.sep, '');
    var lineNo = parseInt(components[1], 10);
    var colNo = parseInt(components[2], 10);

    return {
      message: (e.message).split('\n')[0],
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
