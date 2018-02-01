const path = require("path");

module.exports = class TemplateNotFoundError extends Error {
  constructor(name) {
    const searchedPaths = (path.extname
      ? [name]
      : [`${name}.md`, `${name}.html`]
    ).join(", ");
    super(`could not find template matching ${name} (tried ${searchedPaths})`);
    this.name = "TemplateNotFoundError";
    Error.captureStackTrace(this, this.name);
  }
};
