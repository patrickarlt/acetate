module.exports = function (acetate) {
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
