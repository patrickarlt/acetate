const hljs = require('highlight.js');
const _ = require('lodash');

module.exports = function (acetate) {
  acetate.block('highlight', function (context, body, lang) {
    var highlighted = (lang) ? hljs.highlight(lang, body) : hljs.highlightAuto(body);
    return '<pre><code class="' + highlighted.language + '">' + _.trim(highlighted.value) + '</code></pre>';
  });
};
