module.exports = function(acetate) {
  acetate.block("markdown", function(context, body) {
    return acetate.markdown.render(body);
  });
};
