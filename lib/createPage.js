const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const promisify = require('es6-promisify');
const readFile = promisify(fs.readFile);
const _ = require('lodash');
const MetadataParseError = require('./error-types/MetadataParseError.js');
const { prettyifyUrl, prettyifyDest } = require('./utils');

const METADATA_REGEX = /^(---\n[\s\S]*?)\n---/m;
const MARKDOWN_REGEX = /\.(md|markdown)/;
const HTML_REGEX = /\.html?$/;

function countLeadingNewLines (string) {
  let count = 0;

  while (string.charAt(count) === '\n') {
    count++;
  }

  return Math.max(0, count - 1);
}

function countLines (string) {
  return string.split('\n').length;
}

function getTemplateErrorOffset (metadata, template) {
  return countLines(metadata) + countLeadingNewLines(template);
}

function processTemplate (content = '') {
  const [metadataString, metadataYAML] = content.match(METADATA_REGEX) || ['', ''];
  const rawTemplate = content.replace(metadataString, '');
  const templateErrorOffset = getTemplateErrorOffset(metadataString, rawTemplate);
  const metadata = yaml.safeLoad(metadataYAML);
  const template = _.trim(rawTemplate);

  return { metadata, template, templateErrorOffset };
}

function createPage (src, template = '', metadata = {}, {
  templateErrorOffset = 0
} = {}) {
  const isHTML = HTML_REGEX.test(path.extname(src));
  const isMarkdown = MARKDOWN_REGEX.test(path.extname(src));
  let dest = (isMarkdown) ? src.replace('.md', '.html') : src;
  let url = `/${src}`;

  if (HTML_REGEX.test(dest) && metadata.prettyUrl !== false) {
    url = prettyifyUrl(dest);
    dest = prettyifyDest(dest);
  }

  const page = {
    src,
    template,
    dest,
    url,
    relativePath: path.relative(path.dirname(dest), ''),
    __isHTML: isHTML,
    __isMarkdown: isMarkdown,
    __templateErrorOffset: templateErrorOffset,
    __metadata: metadata
  };

  return Object.assign(page, metadata);
}

function fromTemplateString (src, templateString) {
  try {
    var { metadata, template, templateErrorOffset } = processTemplate(templateString);
  } catch (e) {
    switch (e.name) {
    case 'YAMLException':
      throw (new MetadataParseError(e, src));
    default:
      throw e;
    }
  }

  return createPage(src, template, metadata, {
    templateErrorOffset
  });
}

function fromTemplate (src, templatePath) {
  return readFile(templatePath, 'utf8').then((content) => {
    const page = fromTemplateString(src, content);
    page.templatePath = templatePath;
    return page;
  });
}

createPage.fromTemplate = fromTemplate;

createPage.fromTemplateString = fromTemplateString;

module.exports = createPage;
