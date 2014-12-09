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
};

var colors = {
  'debug': chalk.gray,
  'verbose': chalk.white,
  'info': chalk.cyan,
  'success': chalk.green,
  'warn': chalk.white.bgYellow,
  'error': chalk.white.bgRed
};

function pad(string, to){
  if(string.length < to){
    return new Array(to-string.length).join(' ');
  }
  return '';
}

function Logger (level) {
  this.log = level;
  this.warn('sample', 'sample message');
  this.success('sample', 'success message');
  this.error('sample', 'error message');
}

Logger.prototype._log = function(level, category, message){
  if(levels[this.log] <= levels[level]){
    var rest = Array.prototype.slice.call(arguments, 3);
    var prefix = pad(category, 10) + colors[level]('%s');
    var args = ([prefix + ' ' + message, category]).concat(rest);
    var text = util.format.apply(this, args);
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