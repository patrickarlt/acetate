module.exports = function (acetate) {
  acetate.helper('helper', function (context) {
    throw new Error('Error in helper');
  });

  acetate.block('block', function (context) {
    throw new Error('Error in block');
  });

  acetate.filter('filter', function (context) {
    throw new Error('Error in filter');
  });

  acetate.data('callbackError', 'callbackError.js');
  acetate.data('syntaxError', 'syntaxError.js');
  acetate.data('invalidYaml', 'invalid.yaml');
  acetate.data('invalidJson', 'invalid.json');
};
