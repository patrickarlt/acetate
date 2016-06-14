const url = require('url');
const _ = require('lodash');
const { stripSlashes, ensureTrailingSlash } = require('../utils.js');
const PROTOCOL_REGEX = /^(.+:)?\/\//;

module.exports = function (acetate) {
  acetate.helper('link', function (context, destinationUrl, text) {
    const options = context.options;
    let finalUrl;

    if (PROTOCOL_REGEX.test(destinationUrl)) {
      finalUrl = destinationUrl;
    } else {
      finalUrl = url.resolve(context.page.url, destinationUrl);

      // strip all leading and trailing slashes
      finalUrl = stripSlashes(finalUrl);

      // ensure we have leading slash unless this starts with a protocol
      if (!PROTOCOL_REGEX.test(finalUrl) && finalUrl[0] !== '/') {
        finalUrl = `/${finalUrl}`;
      }

      // ensure there is a trailing slash unless there is a extension
      finalUrl = ensureTrailingSlash(finalUrl);

      // normalize index pages
      finalUrl = finalUrl.replace('index.html', '');
    }

    const hrefAttr = `href="${finalUrl}"`;
    const idAttr = (options.id) ? `id="${options.id}"` : '';

    let isActive = false;
    if (options.requireExactMatch) {
      isActive = context.page.url === finalUrl;
    } else {
      isActive = context.page.url.match(finalUrl) && finalUrl !== '/';
    }

    const classes = (isActive) ? _([options.activeClass, options.class]).compact().join(' ') : options.class;
    const classAttr = (classes && classes.length) ? `class="${classes}"` : '';

    delete options.id;
    delete options.activeClass;
    delete options.class;
    delete options.requireExactMatch;

    const attrs = _(options)
      .map((value, key) => `${key}="${value}"`)
      .reverse()
      .concat([classAttr, idAttr, hrefAttr])
      .reverse()
      .compact()
      .join(' ');

    return `<a ${attrs}>${text}</a>`;
  }, {
    activeClass: 'is-active',
    requireExactMatch: false
  });
};
