const hljs = require("highlight.js");
const _ = require("lodash");

module.exports = function(acetate) {
  acetate.block("highlight", function(context, body, lang) {
    if (lang === "text" || lang === "plain") {
      return `<pre><code class="${lang}">${body}</code></pre>`;
    }

    const highlighted = lang
      ? hljs.highlight(lang, body)
      : hljs.highlightAuto(body);
    return `<pre><code class="${highlighted.language}">${_.trim(
      highlighted.value
    )}</code></pre>`;
  });
};
