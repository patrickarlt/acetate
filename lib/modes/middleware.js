const url = require("url");
const fs = require("fs");
const path = require("path");
const mime = require("mime");
const _ = require("lodash");
const normalizeUrl = require("normalize-url");
const { stripSlashes, ensureTrailingSlash } = require("../utils.js");

const serverErrorTemplatePath = path.join(
  __dirname,
  "../",
  "templates",
  "server-error.html"
);
const serverErrorTemplate = fs.readFileSync(serverErrorTemplatePath, "utf8");
const serverErrorPage = function serverErrorPage(error) {
  return {
    src: "",
    dest: "__acetate/server-error/index.html",
    error: error,
    template: serverErrorTemplate
  };
};

function normalizeRequestUrl(baseUrl) {
  // perform basic URL normalization
  baseUrl = normalizeUrl(baseUrl);

  // ensure we have leading `/` and no trailing `/`
  baseUrl = "/" + stripSlashes(url.parse(baseUrl).pathname || "");

  // ensure there is a trailing slash unless there is a extension
  baseUrl = ensureTrailingSlash(baseUrl);

  // normalize index pages
  baseUrl = baseUrl.replace(/index.html?$/, "");

  return baseUrl;
}

module.exports = function(acetate) {
  const pagesCache = {};

  const acetateMiddleware = function acetateMiddleware(
    request,
    response,
    next
  ) {
    if (request.method !== "GET") {
      next();
      return;
    }

    const normalizedUrl = normalizeRequestUrl(request.url);

    acetate.log.debug(`Looking up ${normalizedUrl}`);

    acetate
      .getPages()
      .then(pages => {
        return Promise.all(pages.map(page => acetate.transformPage(page)));
      })
      .then(pages => {
        return _.filter(pages, page => page.url === normalizedUrl);
      })
      .then(pages => {
        if (pages.length === 0) {
          acetate.log.debug(`no pages matching ${normalizedUrl} found`);
          next();
        }

        if (pages.length > 1) {
          acetate.log.warn(
            `found ${pages.length} pages matching ${normalizedUrl} (${pages
              .map(page => page.src)
              .join(",")})`
          );
        }

        return pages[0];
      })
      .then(page => acetate.transformPage(page))
      .then(page => {
        pagesCache[page.url] = page;
        return Promise.all([
          acetate.renderPage(page),
          Promise.resolve(200),
          Promise.resolve(mime.lookup(page.dest))
        ]);
      })
      .catch(error => {
        return Promise.all([
          acetate.renderPage(serverErrorPage(error)),
          Promise.resolve(500),
          Promise.resolve("text/html")
        ]);
      })
      .then(([output, status, mimeType]) => {
        response.writeHead(status, { "Content-Type": mimeType });
        response.end(output);
      });
  };

  acetateMiddleware.getPageCache = function() {
    return pagesCache;
  };

  return acetateMiddleware;
};
