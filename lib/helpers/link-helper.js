const url = require("url");
const _ = require("lodash");
const { stripSlashes, ensureTrailingSlash } = require("../utils.js");
const PROTOCOL_REGEX = /^(.+:)?\/\//;
const HASH_REGEX = /^#/;

module.exports = function(acetate) {
  acetate.helper(
    "link",
    function(context, destinationUrl, text) {
      const currentUrl = context.options.currentUrl || context.page.url;
      const options = context.options;
      let finalUrl;
      let isActive = false;

      if (
        PROTOCOL_REGEX.test(destinationUrl) ||
        HASH_REGEX.test(destinationUrl)
      ) {
        finalUrl = destinationUrl;
      } else {
        finalUrl = url.resolve(currentUrl, destinationUrl);

        // strip all leading and trailing slashes
        finalUrl = stripSlashes(finalUrl);

        // ensure we have leading slash unless this starts with a protocol
        if (!PROTOCOL_REGEX.test(finalUrl) && finalUrl[0] !== "/") {
          finalUrl = `/${finalUrl}`;
        }

        // ensure there is a trailing slash unless there is a extension
        // and remove index.html
        let parsedUrl = url.parse(finalUrl);
        parsedUrl.pathname = ensureTrailingSlash(parsedUrl.pathname).replace(
          "index.html",
          ""
        );

        finalUrl = url.format(parsedUrl);
      }

      const hrefAttr = `href="${finalUrl}"`;
      const idAttr = options.id ? `id="${options.id}"` : "";
      if (currentUrl === finalUrl) {
        isActive = true;
      } else if (PROTOCOL_REGEX.test(destinationUrl)) {
        isActive = false;
      } else if (HASH_REGEX.test(destinationUrl)) {
        isActive = true;
      } else if (options.requireExactMatch) {
        isActive = currentUrl === finalUrl;
      } else {
        let parsedUrl = url.parse(finalUrl);
        isActive = currentUrl.match(parsedUrl.pathname) && finalUrl !== "/";
      }

      const classes = isActive
        ? _([options.activeClass, options.class]).compact().join(" ")
        : options.class;
      const classAttr = classes && classes.length ? `class="${classes}"` : "";

      delete options.id;
      delete options.activeClass;
      delete options.class;
      delete options.requireExactMatch;
      delete options.currentUrl;

      const attrs = _(options)
        .map((value, key) => `${key}="${value}"`)
        .reverse()
        .concat([classAttr, idAttr, hrefAttr])
        .reverse()
        .compact()
        .join(" ");

      return `<a ${attrs}>${text}</a>`;
    },
    {
      activeClass: "is-active",
      requireExactMatch: false
    }
  );
};
