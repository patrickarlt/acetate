var path = require('path');
var yaml = require('js-yaml');

var exports = {};

var metadataDelimiter = /^([\s\S]+)\n+^-{3}$/m;

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
    throw "Could not parse metadata for " + filePath + '\n' + e;
  }

  return metadata;
}

/**
 * given the content of a file parse the body content out of it.
 * @param  {string} content
 * @return {string}
 */
function parseBody(string){
  return string.toString().replace(metadataDelimiter, '').trim();
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
  getFilename: getFilename,
  parseBody: parseBody,
  parseMetadata: parseMetadata
};