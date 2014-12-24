var path = require('path');
var yaml = require('js-yaml');

var exports = {};

var metadataDelimiter = /^([\s\S]+)^-{3}$/m;

/**
 * Given the contents of a file parse the YAML metadata out of it.
 * @param  {string} content
 * @return {object}
 */
function parseMetadata(content, filePath) {
  var metadataMatches = content.toString().match(metadataDelimiter);
  var metadata = {};

  if(!metadataMatches){
    return metadata;
  }

  try {
    metadataString = metadataMatches[1];
    metadata = (metadataString[0] === '{') ? JSON.parse(metadataString) : yaml.safeLoad(metadataString);
  } catch (e) {
    // @TODO warn about not able to load metadata
    // throw "Could not parse metadata for " + filePath + '\n' + e;
  }

  return metadata;
}

function metadataLines(content){
  return content.toString().match(metadataDelimiter)[0].split('\n').length - 1;
}

/**
 * given the content of a file parse the body content out of it.
 * @param  {string} content
 * @return {string}
 */
function parseBody(content){
  return content.toString().replace(metadataDelimiter, '');
}

/**
 * get the filename for a path.
 * @param  {string} path
 * @return {string}
 */
function getFilename(filepath){
  return path.basename(filepath, path.extname(filepath));
}

module.exports = {
  metadataLines: metadataLines,
  getFilename: getFilename,
  parseBody: parseBody,
  parseMetadata: parseMetadata
};