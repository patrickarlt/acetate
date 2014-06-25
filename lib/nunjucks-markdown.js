module.exports = function NunjucksMarkdown(options) {
  this.renderer = options.renderer;

  this.tags = ['markdown'];

  this.parse = function(parser, nodes, lexer) {
    // parse to the end of the block
    parser.advanceAfterBlockEnd(parser.nextToken().value);

    // parse the body
    var body = parser.parseUntilBlocks('endmarkdown');

    // set the parser to just past the body
    parser.advanceAfterBlockEnd();

    // call a new async node to render the content
    return new nodes.CallExtensionAsync(this, 'run', undefined, [body]);
  };

  this.run = function(context, body, callback) {
    this.renderer(body(), callback);
  };
};