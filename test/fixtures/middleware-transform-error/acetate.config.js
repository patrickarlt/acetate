module.exports = function (acetate) {
  acetate.load('**/*.+(md|html)');
  acetate.transform('**/*.+(md|html)', function () {
    throw new Error('D\'oh');
  });
};
