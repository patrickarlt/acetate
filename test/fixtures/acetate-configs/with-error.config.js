module.exports = function (acetate) {
  acetate.load('**/*.+(md|html)');

  acetate.metadata('**/*', {
    foo:
  });
};
