const chalk = require('chalk');
const util = require('util');
const EventEmitter = require('events');
const uuid = require('node-uuid').v4;
const prettyHrtime = require('pretty-hrtime');

const LEVELS = {
  'debug': 1,
  'info': 2,
  'success': 2,
  'warn': 3,
  'error': 3
};

const COLORS = {
  'debug': chalk.dim,
  'info': string => string,
  'success': chalk.green,
  'warn': chalk.yellow,
  'error': chalk.red
};

module.exports = class Logger extends EventEmitter {
  constructor ({
    level = 'info'
  } = {}) {
    super();
    this._prefix = '[' + chalk.blue('Acetate') + ']';
    this._timers = {};
    this._level = LEVELS[level] || Infinity;
  }

  time (label) {
    label = label || uuid();
    this._timers[label] = process.hrtime();
    return label;
  }

  timeEnd (label) {
    const end = process.hrtime(this._timers[label]);
    delete this._timers[label];
    return prettyHrtime(end);
  }

  log (level, message, ...rest) {
    const color = COLORS[level];
    const args = ([this._prefix + ' ' + color(message)]).concat(rest);
    const text = util.format.apply({}, args);
    const print = this._level <= LEVELS[level];

    this.emit('log', {
      show: print,
      level: level,
      text: util.format.apply({}, ([message]).concat(rest))
    });

    if (print) {
      process.stdout.write(text + '\n');
    }

    return text;
  }

  debug (message, ...rest) {
    return this.log('debug', message, ...rest);
  }

  info (message, ...rest) {
    return this.log('info', message, ...rest);
  }

  success (message, ...rest) {
    return this.log('success', message, ...rest);
  }

  warn (message, ...rest) {
    return this.log('warn', message, ...rest);
  }

  error (message, ...rest) {
    return this.log('error', message, ...rest);
  }
};
