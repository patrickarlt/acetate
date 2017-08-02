const fs = require("fs");
const path = require("path");
const promisify = require("es6-promisify");
const readFile = promisify(fs.readFile);

const MetadataParseError = require("./error-types/MetadataParseError.js");
const {
  prettyifyUrl,
  prettyifyDest,
  mergeMetadata,
  processTemplate
} = require("./utils");

const MARKDOWN_REGEX = /\.(md|markdown)/;
const HTML_REGEX = /\.html?$/;

function createPage(
  src,
  template = "",
  metadata = {},
  { templateErrorOffset = 0, basePath = "" } = {}
) {
  const isMarkdown = MARKDOWN_REGEX.test(path.extname(src));
  let dest = path.normalize(
    path.join(basePath, isMarkdown ? src.replace(".md", ".html") : src)
  );
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
    relativePath:
      path.relative(path.dirname(dest), "").replace(/\\/g, "/") || ".",
    __isMarkdown: isMarkdown,
    __templateErrorOffset: templateErrorOffset,
    __metadata: metadata
  };

  return mergeMetadata(page, metadata);
}

function fromTemplateString(
  src,
  templateString,
  defaultMetadata = {},
  { basePath = "" } = {}
) {
  try {
    var { metadata, template, templateErrorOffset } = processTemplate(
      templateString
    );
  } catch (e) {
    switch (e.name) {
      case "YAMLException":
        throw new MetadataParseError(e, src);
      default:
        throw e;
    }
  }

  const page = createPage(src, template, metadata, {
    templateErrorOffset,
    basePath
  });

  page.__defaultMetadata = defaultMetadata;

  return mergeMetadata(page, defaultMetadata);
}

function fromTemplate(src, templatePath, defaultMetadata = {}, options) {
  return readFile(templatePath, "utf8").then(content => {
    const page = fromTemplateString(src, content, defaultMetadata, options);
    page.templatePath = templatePath;
    return page;
  });
}

createPage.fromTemplate = fromTemplate;

createPage.fromTemplateString = fromTemplateString;

module.exports = createPage;
