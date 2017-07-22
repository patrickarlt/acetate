const path = require("path");
const _ = require("lodash");

const PRETTY_URL_REGEX = /\.html|\.md|index\.html|index\.md/;

function stripSlashes(string = "") {
  var count = string.length - 1;
  var index = 0;

  while (string.charCodeAt(index) === 47 && ++index);
  while (string.charCodeAt(count) === 47 && --count);

  string = string.slice(index, count + 1);

  return string;
}

function prettyifyUrl(src) {
  var base = stripSlashes(src.replace(PRETTY_URL_REGEX, "")).replace(
    /\\/g,
    "/"
  );
  return base ? "/" + base + "/" : "/";
}

function prettyifyDest(src) {
  var base = stripSlashes(src.replace(PRETTY_URL_REGEX, ""));

  if (!base) {
    return "index.html";
  }

  return [base, "index.html"].join("/");
}

function ensureTrailingSlash(baseUrl) {
  let ext = path.extname(baseUrl);

  if (!ext && baseUrl[baseUrl.length - 1] !== "/") {
    baseUrl = baseUrl + "/";
  }

  return baseUrl;
}

function mergeMetadata(page, metadata) {
  return _.mergeWith(page, metadata, page.__metadata, function(
    objValue,
    srcValue
  ) {
    if (_.isArray(srcValue)) {
      return srcValue;
    }
  });
}

module.exports = {
  prettyifyUrl,
  prettyifyDest,
  stripSlashes,
  ensureTrailingSlash,
  mergeMetadata
};
