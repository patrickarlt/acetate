var hljs = require('highlight.js');

function NunjucksHighlight() {
  this.tags = ['highlight'];

  this.parse = function(parser, nodes, lexer) {
    // get the tag token
    var tok = parser.nextToken();

    // parse the args and move after the block end. passing true
    // as the second arg is required if there are no parentheses
    var args = parser.parseSignature(null, true);

    parser.advanceAfterBlockEnd(tok.value);

    // parse the body and possibly the error block, which is optional
    var body = parser.parseUntilBlocks('endhighlight');

    parser.advanceAfterBlockEnd();

    // See above for notes about CallExtension
    return new nodes.CallExtension(this, 'run', args, [body]);
  };

  this.run = function(context, lang, body) {
    var code = body();
    var highlighted = (lang) ? hljs.highlight(lang, code) : hljs.highlightAuto(code);
    return '<pre><code class="hljs ' + highlighted.language + '">' + highlighted.value.trim() + '</code></pre>';
  };
}

var extension = {
  register: function(press){
    press.marked.setOptions({
      highlight: function (code, lang) {
        return (lang) ? hljs.highlight(lang, code).value : hljs.highlightAuto(code).value;
      }
    });

    press.nunjucks.addExtension('highlight', new NunjucksHighlight());
  }
};

module.exports = extension;