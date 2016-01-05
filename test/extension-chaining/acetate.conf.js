module.exports = function (acetate) {
  acetate.use(function (acetate, next) {
    acetate.output({
      dest: 'index.html',
      nunjucks: '{{foo}}',
      metadata: {
        foo: 'foo'
      }
    });
    next(null, acetate);
  })
}