const nunjucks = require('nunjucks');
const _ = require('lodash');
const CustomHelperError = require('../error-types/CustomHelperError.js');

module.exports = class Block {
  constructor (name, handler, defaults) {
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

    parser.advanceAfterBlockEnd(token.value);

    // parse the body
    var body = parser.parseUntilBlocks('end' + this.name);

    parser.advanceAfterBlockEnd();

    // See above for notes about CallExtension
    return new nodes.CallExtension(this, 'run', args, [body]);
  }

  run () {
    const args = Array.prototype.slice.call(arguments);
    const page = args.shift().ctx;
    const body = args.pop();
    var keywords;

    if (args[args.length - 1] && args[args.length - 1].__keywords) {
      keywords = args.pop();
      delete keywords.__keywords;
    } else {
      keywords = {};
    }

    const context = {
      page: page,
      options: _.defaults(keywords, this.defaults)
    };

    let result;

    try {
      result = this.handler(context, _.trim(body()), ...args);
    } catch (e) {
      throw new CustomHelperError('block', this.name, e);
    }

    return new nunjucks.runtime.SafeString(result);
  }
};
