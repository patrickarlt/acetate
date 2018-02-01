module.exports = class PageNotFoundError extends Error {
  constructor(url) {
    super(`No page found matching ${url}`);
    this.url = url;
    this.name = "PageNotFoundError";
    Error.captureStackTrace(this, "PageNotFoundError");
  }
};
