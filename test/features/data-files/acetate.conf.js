module.exports = function (acetate) {
  acetate.data('global', 'valid/global-data.json');

  acetate.data('callbackError', 'invalid/callbackError.js');
  acetate.data('syntaxError', 'invalid/syntaxError.js');
  acetate.data('invalidYaml', 'invalid/invalid.yaml');
  acetate.data('invalidJson', 'invalid/invalid.json');
};
