const path = require('path');
const errorUtils = require('./utils');

module.exports = class TemplateNotFoundError extends Error {
  constructor (name) {
    const searchedPaths = ((path.extname) ? [name] : [`${name}.md`, `${name}.html`]).join(', ');
    super(`could not find template matching ${name} (tried ${searchedPaths})`);
    this.name = 'TemplateNotFoundError';
    this._acetateError = true;
    Error.captureStackTrace(this, this.name);
  }

  toJSON () {
    return errorUtils.toJSON(this);
  }
};
