var chalk = require('chalk');
var util = require('util');
var _ = require('lodash');
var path = require('path');

var levels = {
  'debug': 1,
  'verbose': 2,
  'info': 3,
  'success': 4,
  'warn': 4,
  'error': 5,
  'silent': 6
};

var colors = {
  'debug': chalk.gray,
  'verbose': chalk.white,
  'info': chalk.cyan,
  'success': chalk.green,
  'warn': chalk.white.bgYellow,
  'error': chalk.white.bgRed,
  'silent': chalk.gray
};

function round (x, digits) {
  return parseFloat(x.toFixed(digits));
}

module.exports = function (acetate, logLevel) {
  var prefix = chalk.gray('[') + chalk.blue('ACETATE') + chalk.gray(']');
  var timers = {};

  var time = function (label) {
    timers[label] = process.hrtime();
  };

  var timeEnd = function (label) {
    var diff = process.hrtime(timers[label]);
    var ms = (diff[1] / 1000000) + (diff[0] * 1000);
    return (ms > 1000) ? round(ms / 1000, 2) + 's' : round(ms, 2) + 'ms';
  };

  var stacktrace = function (stacktrace) {
    var lines = stacktrace.split('\n');
    for (var i = 0; i < lines.length; i++) {
      log('error', '', _.trim(lines[i]));
    }
  };

  var log = function (level, category, message) {
    var rest = Array.prototype.slice.call(arguments, 3);
    var args = ([prefix + ' ' + colors[level]('%s') + ' ' + message, category]).concat(rest);
    var text = util.format.apply(this, args);
    var print = levels[logLevel] <= levels[level];

    var data = {
      level: level,
      text: util.format.apply(this, ([message]).concat(rest)),
      category: category
    };

    acetate.emit('log', data);

    if (print) {
      process.stdout.write(text + '\n');
    }
  };

  var parseException = function (e) {
    var components = e.stack.split('\n')[1] // first line of the stacktrace
                            .split(' ') // split by spaces (' ')
                            .pop() // pop the last word off
                            .replace(/[\(|\)]/g, '') // replace parens
                            .split(':'); // split on : to seperate path:line:col
    var errorPath = components[0].replace(acetate.root + path.sep, '');
    var lineNo = parseInt(components[1], 10);
    var colNo = parseInt(components[2], 10);

    return {
      message: (e.message || e.stack || e).split('\n')[0],
      path: errorPath,
      lineNo: lineNo,
      colNo: colNo
    };
  };

  var formatException = function (error) {
    var e = parseException(error);

    return util.format('%s - %s:%d:%d', e.message, e.path, e.lineNo, e.colNo);
  };

  return {
    formatException: formatException,
    parseException: parseException,
    time: time,
    timeEnd: timeEnd,
    stacktrace: stacktrace,
    log: log,
    debug: _.partial(log, 'debug'),
    verbose: _.partial(log, 'verbose'),
    info: _.partial(log, 'info'),
    success: _.partial(log, 'success'),
    warn: _.partial(log, 'warn'),
    error: _.partial(log, 'error'),
    silent: _.partial(log, 'silent')
  };
};
