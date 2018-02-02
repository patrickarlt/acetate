module.exports = function (acetate) {
  acetate.load("**/*");

  acetate.metadata("**/*", {
    foo: "foo"
  });
};
