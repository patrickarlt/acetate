module.exports = function (acetate) {
  acetate.query('lengthByGlob', '**/*', function (pages) {
    return pages.length;
  });

  acetate.query('lengthByFunction', function (page) {
    return page.include;
  }, function (pages) {
    return pages.length;
  });

  acetate.query('lengthByObject', {
    include: true
  }, function (pages) {
    return pages.length;
  });
};
