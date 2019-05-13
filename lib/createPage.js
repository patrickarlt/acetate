const path = require("path");
const { readFile, pathExists, readJson } = require("fs-extra");
const yaml = require("js-yaml");
const _ = require("lodash");

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

  let url = `/${path.normalize(src).replace(/\\/g, "/")}`;

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
  const filename = path.basename(templatePath, path.extname(templatePath));
  const dirname = path.dirname(templatePath);
  const yamlMetadataPath = path.join(dirname, `${filename}.metadata.yaml`);
  const jsonMetadataPath = path.join(dirname, `${filename}.metadata.json`);

  const page = readFile(templatePath, "utf8");
  const yamlMetadata = pathExists(yamlMetadataPath)
    .then(exists => (exists ? readFile(yamlMetadataPath) : Promise.resolve("")))
    .then(yamlString => {
      return Promise.resolve(yaml.safeLoad(yamlString));
    });

  const jsonMetadata = pathExists(jsonMetadataPath).then(
    exists => (exists ? readJson(jsonMetadataPath) : Promise.resolve({}))
  );

  return Promise.all([page, yamlMetadata, jsonMetadata]).then(
    ([pageContent, externalYaml, externalJson]) => {
      const metadata = _.merge(defaultMetadata, externalYaml, externalJson);

      const page = fromTemplateString(
        typeof src === "function" ? src(metadata) : src,
        pageContent,
        metadata,
        options
      );

      page.templatePath = templatePath;
      return page;
    }
  );
}

createPage.fromTemplate = fromTemplate;

createPage.fromTemplateString = fromTemplateString;

module.exports = createPage;
