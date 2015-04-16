module.exports = function (acetate) {
  acetate.use(function () {
    throw new Error('Error in extension');
  });
};
