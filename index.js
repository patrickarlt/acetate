var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var utils = require('./lib/utils');

var logger = require('./lib/mixins/logger');
var nunjucks = require('./lib/mixins/nunjucks');
var markdown = require('./lib/mixins/markdown');
var loader = require('./lib/mixins/loader');
var builder = require('./lib/mixins/builder');
var helpers = require('./lib/mixins/helpers');
var server = require('./lib/mixins/server');
var watcher = require('./lib/mixins/watcher');
var initializer = require('./lib/mixins/initializer');

function acetate (options) {
  // merge options with defaults
  options = _.defaults(options, {
    config: 'acetate.conf.js',
    src: 'src',
    dest: 'build',
    root: process.cwd(),
    log: 'info',
    watcher: false,
    server: false,
    host: 'localhost',
    port: 8000,
    findPort: false,
    args: {}
  });

  // create the `site` object which is events + logger + options + utils
  var site = _.extend({}, EventEmitter.prototype, logger(), {
    util: utils(options),
    options: Object.freeze(options)
  });

  // define read-only `root` property on `site`
  Object.defineProperty(site, 'root', {
    value: options.root,
    enumerable: true
  });

  // define read-only `src` property on `site`
  Object.defineProperty(site, 'src', {
    value: options.src,
    enumerable: true
  });

  // define read-only `dest` property on `site`
  Object.defineProperty(site, 'dest', {
    value: options.dest,
    enumerable: true
  });

  // define read-only `config` property on `site`
  Object.defineProperty(site, 'config', {
    value: options.config,
    enumerable: true
  });

  // define read-only `args` on `site`
  Object.defineProperty(site, 'args', {
    value: Object.freeze(options.args),
    enumerable: true
  });

  // mixin all of the different components
  // do each seperatly so they are cumulative
  // some have some dependencies on each other
  _.extend(site, markdown(site));
  _.extend(site, nunjucks(site));
  _.extend(site, loader(site));
  _.extend(site, builder(site));
  _.extend(site, helpers(site));
  _.extend(site, server(site));
  _.extend(site, watcher(site));
  _.extend(site, initializer(site));

  // on the next run of the event loop start everything
  // this delays initalziation so event listeners can be added
  // https://nodejs.org/api/process.html#process_process_nexttick_callback
  process.nextTick(function () {
    site.init();
  });

  return site;
};

module.exports = acetate;
