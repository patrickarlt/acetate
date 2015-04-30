module.exports = function (acetate) {
  acetate.transform('**/*', function (pages) {
    pages[0].transformedByGlob = true;
  });

  acetate.transform(function (page) {
    return page.transformMe;
  }, function (pages) {
    pages[0].transformedByFunction = true;
  });

  acetate.transform({
    transformMe: true
  }, function (pages) {
    pages[0].transformedByObject = true;
  });
};
