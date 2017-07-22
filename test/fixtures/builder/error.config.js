module.exports = function (acetate) {
  acetate.load("**/*");
  acetate.transform("**/*", function () {
    throw new Error("D'oh");
  });
};
