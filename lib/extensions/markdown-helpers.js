function NunjucksMarkdown(options) {
  this.markdown = options.markdown;

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
    this.markdown.render(body(), callback);
  };
}

module.exports = function(acetate, callback){
  acetate.log.debug('extension', 'adding markdown helpers to nunjucks');

  acetate.nunjucks.addExtension('markdown', new NunjucksMarkdown({
    markdown: acetate.markdown
  }));

  callback();
};