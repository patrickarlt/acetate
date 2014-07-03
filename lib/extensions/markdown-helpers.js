function NunjucksMarkdown(options) {
  this.marked = options.marked;

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
    this.marked(body(), callback);
  };
}

var extension = {
  register: function(press){
    press.nunjucks.addExtension('markdown', new NunjucksMarkdown({
      marked: press.marked
    }));
  }
};

module.exports = extension;