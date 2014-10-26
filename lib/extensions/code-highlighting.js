var hljs = require('highlight.js');

function NunjucksHighlight() {
  this.tags = ['highlight'];

  this.parse = function(parser, nodes, lexer) {
    // get the tag token
    var token = parser.nextToken();

    // parse the args and move after the block end. passing true
    // as the second arg is required if there are no parentheses
    var args = parser.parseSignature(null, true);

    parser.advanceAfterBlockEnd(token.value);

    // parse the body and possibly the error block, which is optional
    var body = parser.parseUntilBlocks('endhighlight');

    parser.advanceAfterBlockEnd();

    // See above for notes about CallExtension
    return new nodes.CallExtension(this, 'run', args, [body]);
  };

  this.run = function(context, lang, body) {
    if(!body){
      body = lang;
      lang = 'auto';
    }
    var code = body();
    var highlighted = (lang === 'auto') ? hljs.highlightAuto(code) : hljs.highlight(lang, code);

    return '<pre><code class="hljs ' + highlighted.language + '">' + highlighted.value.trim() + '</code></pre>';
  };
}

module.exports = function(acetate, callback){
  acetate.debug('extension', 'adding code highlighing helpers for marked and nunjucks');

  acetate.marked.setOptions({
    highlight: function (code, lang) {
      return (lang) ? hljs.highlight(lang, code).value : hljs.highlightAuto(code).value;
    }
  });

  acetate.nunjucks.addExtension('highlight', new NunjucksHighlight());

  callback();
};