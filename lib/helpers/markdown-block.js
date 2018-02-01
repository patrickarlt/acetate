module.exports = function(acetate) {
  acetate.block("markdown", function(context, body) {
    return acetate.renderer.markdown.render(body);
  });
};
