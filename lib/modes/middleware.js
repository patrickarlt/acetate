const url = require("url");
const fs = require("fs");
const path = require("path");
const mime = require("mime");
const _ = require("lodash");
const normalizeUrl = require("normalize-url");
const { stripSlashes, ensureTrailingSlash } = require("../utils.js");
const PageNotFoundError = require("../error-types/PageNotFoundError.js");

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
  var pagesCache = {};

  function findPage(requestUrl) {
    return acetate.loader
      .getPages()
      .then(pages => acetate.transformer.transformPages(pages))
      .then(pages => {
        pagesCache = _.keyBy(pages, "url");
        return pages;
      })
      .then(pages => _.filter(pages, page => page.url === requestUrl))
      .then(pages => {
        if (pages.length > 1) {
          acetate.warn(
            `found ${pages.length} pages matching ${requestUrl} (${pages
              .map(page => page.src)
              .join(",")})`
          );
          return pages[0];
        }
        return pages[0];
      });
  }

  function renderPage(page, status = 200) {
    if (page.ignore) {
      acetate.warn(
        `Page ${page.src} is ignored but server will still process and serve it`
      );
    }

    return Promise.all([
      Promise.resolve(page),
      acetate.renderer.renderPage(page)
    ])
      .then(([page, output]) => {
        pagesCache[page.url] = page;
        return Promise.all([
          Promise.resolve(page),
          Promise.resolve(status),
          Promise.resolve(output)
        ]);
      })
      .catch(error => {
        return Promise.all([
          Promise.resolve(page),
          Promise.resolve(500),
          acetate.renderer.renderPage(serverErrorPage(error))
        ]);
      });
  }

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
    acetate.debug(`Looking up ${normalizedUrl}`);
    findPage(normalizedUrl)
      .then(page => {
        if (!page) {
          return Promise.reject(new PageNotFoundError(normalizedUrl));
        }
        return renderPage(page);
      })
      .catch(error => {
        if (error.name === "PageNotFoundError") {
          acetate.debug(`No page matching ${normalizedUrl} found`);
          next();
          return Promise.reject(error);
        } else {
          return renderPage(serverErrorPage(error), 500);
        }
      })
      .then(([page, status, html]) => {
        response.writeHead(status, { "Content-Type": mime.lookup(page.dest) });
        response.end(html);
      })
      .catch(error => {
        if (error.name !== "PageNotFoundError") {
          acetate.error(`Uncaught error in middleware ${error}`);
        }
      });
  };

  acetateMiddleware.getPageCache = function() {
    return pagesCache;
  };

  return acetateMiddleware;
};
