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

  acetate.helper('errorHelper', function (context, text) {
    throw new Error('error in custom helper');
  });

  acetate.block('errorBlock', function (context) {
    throw new Error('error in custom block');
  });

  acetate.filter('errorFilter', function (value) {
    throw new Error('error in custom filter');
  });
};
