var _ = require('lodash');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var utils = require('./utils');

var logger = require('./mixins/logger');
var nunjucks = require('./mixins/nunjucks');
var markdown = require('./mixins/markdown');
var loader = require('./mixins/loader');
var builder = require('./mixins/builder');
var helpers = require('./mixins/helpers');
var initializer = require('./mixins/initializer');

module.exports = function (options) {
  // create the `site` object which is events + logger + options + utils
  var site = _.extend({}, EventEmitter.prototype, logger(), {
    util: utils(options),
    options: options
  });

  Object.defineProperty(site, 'root', {
    get: function () {
      return this.options.root;
    },
    set: function (value) {
      this.options.root = value;
    }
  });

  Object.defineProperty(site, 'src', {
    get: function () {
      return path.join(this.options.root, this.options.src);
    },
    set: function (value) {
      this.options.src = value;
    }
  });

  Object.defineProperty(site, 'dest', {
    get: function () {
      return path.join(this.options.root, this.options.dest);
    },
    set: function (value) {
      this.options.dest = value;
    }
  });

  Object.defineProperty(site, 'config', {
    get: function () {
      return path.join(this.options.root, this.options.config);
    },
    set: function (value) {
      this.options.config = value;
    }
  });

  site.args = options.args;

  // mixin all of the different components
  // do each seperatly so they are cumulative
  // some have some dependencies on each other
  _.extend(site, markdown(site));
  _.extend(site, nunjucks(site));
  _.extend(site, loader(site));
  _.extend(site, builder(site));
  _.extend(site, helpers(site));
  _.extend(site, initializer(site));

  // on the next run of the event loop start everything
  // this delays initalziation so event listeners can be added
  // https://nodejs.org/api/process.html#process_process_nexttick_callback
  process.nextTick(function () {
    site.init();
  });

  return site;
};
