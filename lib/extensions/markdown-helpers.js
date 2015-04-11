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
    return new nodes.CallExtension(this, 'run', undefined, [body]);
  };

  this.run = function(context, body, callback) {
    return this.markdown.render(body());
  };
}

module.exports = function(acetate, callback){
  acetate.log.debug('extension', 'adding markdown helpers to nunjucks');

  acetate.nunjucks.addExtension('markdown', new NunjucksMarkdown({
    markdown: acetate.markdown
  }));

  callback(undefined, acetate);
};