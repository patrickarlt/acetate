var _ = require('lodash');
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
    options: Object.freeze(options)
  });

  // assign read only shortcuts for a few
  // properties we need in lots of places
  _.each(_.pick(options, ['src', 'dest', 'config', 'root', 'args']), function (value, key) {
    Object.defineProperty(site, key, {
      value: (_.isPlainObject(value)) ? Object.freeze(value) : value,
      enumerable: true
    });
  });

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
