const path = require("path");
const _ = require("lodash");
const yaml = require("js-yaml");
const normalizeNewline = require("normalize-newline");
const METADATA_REGEX = /^(---\n[\s\S]*?)\n---/m;

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
  var base = stripSlashes(src.replace(PRETTY_URL_REGEX, "").replace(
    /\\/g,
    "/"
  ));

  return base ? "/" + base + "/" : "/";
}

function prettyifyDest(src) {
  var base = stripSlashes(src.replace(PRETTY_URL_REGEX, ""));

  if (!base) {
    return "index.html";
  }

  return path.join(base, "index.html");
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

function countLeadingNewLines(string) {
  let count = 0;

  while (string.charAt(count) === "\n") {
    count++;
  }

  return Math.max(0, count - 1);
}

function countLines(string) {
  return string.split("\n").length;
}

function getTemplateErrorOffset(metadata, template) {
  return countLines(metadata) + countLeadingNewLines(template);
}

function processTemplate(content = "") {
  content = normalizeNewline(content);
  const [metadataString, metadataYAML] = content.match(METADATA_REGEX) || [
    "",
    ""
  ];
  const rawTemplate = content.replace(metadataString, "");
  const templateErrorOffset = getTemplateErrorOffset(
    metadataString,
    rawTemplate
  );
  const metadata = yaml.safeLoad(metadataYAML);
  const template = _.trim(rawTemplate);

  return { metadata, template, templateErrorOffset };
}

module.exports = {
  prettyifyUrl,
  prettyifyDest,
  stripSlashes,
  ensureTrailingSlash,
  mergeMetadata,
  processTemplate
};
