const path = require('path');
const PRETTY_URL_REGEX = /\.html|\.md|index\.html|index\.md/;

function stripSlashes (string = '') {
  var count = string.length - 1;
  var index = 0;

  while (string.charCodeAt(index) === 47 && ++index);
  while (string.charCodeAt(count) === 47 && --count);

  string = string.slice(index, count + 1);

  return string;
}

function prettyifyUrl (src) {
  var base = stripSlashes(src.replace(PRETTY_URL_REGEX, ''));
  return base ? '/' + base + '/' : '/';
}

function prettyifyDest (src) {
  var base = stripSlashes(src.replace(PRETTY_URL_REGEX, ''));

  if (!base) {
    return 'index.html';
  }

  return [base, 'index.html'].join('/');
}

function ensureTrailingSlash (baseUrl) {
  let ext = path.extname(baseUrl);

  if (!ext && baseUrl[baseUrl.length - 1] !== '/') {
    baseUrl = baseUrl + '/';
  }

  return baseUrl;
}

module.exports = {
  prettyifyUrl,
  prettyifyDest,
  stripSlashes,
  ensureTrailingSlash
};
