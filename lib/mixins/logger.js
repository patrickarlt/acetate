var chalk = require('chalk');
var util = require('util');
var _ = require('lodash');

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

module.exports = function (acetate) {
  var prefix = chalk.gray('[') + chalk.blue('Acetate') + chalk.gray(']');
  var timers = {};

  function time (label) {
    timers[label] = process.hrtime();
  }

  function timeEnd (label) {
    var diff = process.hrtime(timers[label]);
    var ms = (diff[1] / 1000000) + (diff[0] * 1000);
    return round(ms, 2) + 'ms';
  }

  function log (level, category, message) {
    var rest = Array.prototype.slice.call(arguments, 3);
    var args = ([prefix + ' ' + colors[level]('%s') + ' ' + message, category]).concat(rest);
    var text = util.format.apply({}, args);
    var print = levels[this.options.log] <= levels[level];

    var data = {
      show: print,
      level: level,
      text: util.format.apply({}, ([message]).concat(rest)),
      category: category
    };

    this.emit('log', data);

    if (print) {
      process.stdout.write(text + '\n');
    }
  }

  return {
    time: time,
    timeEnd: timeEnd,
    debug: _.partial(log, 'debug'),
    verbose: _.partial(log, 'verbose'),
    info: _.partial(log, 'info'),
    success: _.partial(log, 'success'),
    warn: _.partial(log, 'warn'),
    error: _.partial(log, 'error'),
    silent: _.partial(log, 'silent')
  };
};
