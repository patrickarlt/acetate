var chalk = require('chalk');
var util = require('util');
var _ = require('lodash');
var events = require("events");

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

function pad(string, to){
  if(string.length < to){
    return new Array(to-string.length).join(' ');
  }
  return '';
}

function Logger (level, silent) {
  this.level = level;
  this.silent = silent;
  events.EventEmitter.call(this);
}

util.inherits(Logger, events.EventEmitter);

Logger.prototype._log = function(level, category, message){
  var rest = Array.prototype.slice.call(arguments, 3);
  var prefix = pad(category, 10) + colors[level]('%s');
  var args = ([prefix + ' ' + message, category]).concat(rest);
  var text = util.format.apply(this, args);
  var print = levels[this.level] <= levels[level];

  var data = {
    level: level,
    category: category,
    message: message,
    text: text,
    show: print,
    color: colors[level],
    args: rest
  };

  this.emit('log', data);
  this.emit(level, data);

  if(print && !this.silent){
    process.stdout.write(text + '\n');
  }

};

_.each(levels, function(level, name){
  Logger.prototype[name] = function(category, message){
    var rest = Array.prototype.slice.call(arguments, 2);
    var args = [name, category, message].concat(rest);
    this._log.apply(this, args);
  };
}, this);

module.exports = Logger;