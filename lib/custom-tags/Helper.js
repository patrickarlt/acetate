const nunjucks = require('nunjucks');
const _ = require('lodash');
const CustomHelperError = require('../error-types/CustomHelperError.js');

module.exports = class Helper {
  constructor (name, handler, defaults = {}) {
    this.name = name;
    this.tags = [name];
    this.handler = handler;
    this.defaults = defaults;
  }

  parse (parser, nodes) {
    // get the tag token
    var token = parser.nextToken();

    // parse the args and move after the block end. passing true
    // as the second arg is required if there are no parentheses
    var args = parser.parseSignature(null, true);

    // You must include this if there are no args to prevent errors
    if (args.children.length === 0) {
      args.addChild(new nodes.Literal(0, 0, ''));
    }

    parser.advanceAfterBlockEnd(token.value);

    // See above for notes about CallExtension
    return new nodes.CallExtension(this, 'run', args);
  }

  run () {
    const args = Array.prototype.slice.call(arguments);
    const page = args.shift().ctx;
    let keywords;

    if (args[args.length - 1] && args[args.length - 1].__keywords) {
      keywords = args.pop();
      delete keywords.__keywords;
    } else {
      keywords = {};
    }

    const context = {
      page,
      options: _.defaults(keywords, this.defaults)
    };

    let result;

    try {
      result = this.handler(context, ...args);
    } catch (e) {
      throw new CustomHelperError('helper', this.name, e);
    }

    return new nunjucks.runtime.SafeString(result);
  }
};
