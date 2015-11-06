module.exports = function (acetate) {
  acetate.helper('helperWithParams', function (context, text) {
    return context.title + '\n' + text + '\nhelper';
  });

  acetate.helper('helperNoParams', function (context) {
    return 'foo';
  });

  acetate.block('content', function (context, text) {
    return context.title + '\n' + text + '\nblock';
  });

  acetate.filter('filter', function (value) {
    return value + ' filter';
  });
};
