module.exports = function (acetate) {
  acetate.helper('helper', function (context, text) {
    return context.title + '\n' + text + '\nhelper';
  });

  acetate.block('content', function (context, text) {
    return context.title + '\n' + text + '\nblock';
  });

  acetate.filter('filter', function (value) {
    return value + ' filter';
  });
};
