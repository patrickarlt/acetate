const nunjucks = require('nunjucks');
const path = require('path');
const fs = require('fs');
const minimatch = require('minimatch');
const async = require('async');
const _ = require('lodash');
const glob = require('glob');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const normalizeNewline = require('normalize-newline');
const Helper = require('./custom-tags/Helper.js');
const Block = require('./custom-tags/Block.js');
const CustomHelperError = require('./error-types/CustomHelperError.js');
const PageRenderError = require('./error-types/PageRenderError.js');
const TemplateNotFoundError = require('./error-types/TemplateNotFoundError.js');
const Logger = require('./Logger.js');
const EventEmitter = require('events');

const Loader = nunjucks.Loader.extend({
  init: function ({
    sourceDir,
    logger,
    errorHandler
  }) {
    this.sourceDir = sourceDir;
    this.logger = logger;
    this.errorHandler = errorHandler;
  },

  getSource: function (name) {
    this.logger.debug(`looking up templates ${name}, ${name}.md, ${name}.html`);

    const matches = glob.sync(`${name}?(.html|.md|)`, {
      cwd: this.sourceDir
    });

    if (!matches || !matches.length) {
      throw new TemplateNotFoundError(name);
    }

    if (matches.length > 1) {
      this.logger.warn(`Found multiple templates matching ${name}. ${matches.join(',')}`);
    }

    const fullpath = path.join(this.sourceDir, matches.sort((a, b) => a.length - b.length)[0]);

    const content = fs.readFileSync(fullpath, 'utf8');

    const template = _.trim(_.last(content.split(/^([\s\S]+)^-{3}$/m)));

    return {
      src: normalizeNewline(template),
      path: fullpath
    };
  }
});

class Renderer {
  constructor ({
    sourceDir = path.join(process.cwd(), 'src'),
    log = 'info',
    emitter = new EventEmitter(),
    logger
  } = {}) {
    this.sourceDir = sourceDir;
    this.logger = logger || new Logger({level: log});
    this.emitter = emitter;
    this.reset();
  }

  _createPrerenderFunction (pattern, prerenderer) {
    return function (page, done) {
      if (minimatch(page.src, pattern)) {
        try {
          prerenderer(page, done);
        } catch (e) {
          done(e);
        }
      } else {
        done(null, page);
      }
    };
  }

  reset () {
    this._prerenderers = [];

    this.loader = new Loader({
      sourceDir: this.sourceDir,
      logger: this.logger,
      errorHandler: (error) => {
        this.emitter.emit('renderer:error', {
          error
        });
        this.logger.error(error);
      }
    });

    this.nunjucks = new nunjucks.Environment(this.loader, {
      // dev: true
    });

    this.markdown = new MarkdownIt({
      html: true,
      linkify: true,
      langPrefix: '',
      highlight: function (code, lang) {
        if (lang === 'text' || lang === 'plain') {
          return code;
        }

        return (lang) ? hljs.highlight(lang, code).value : hljs.highlightAuto(code).value;
      }
    });
  }

  prerender (pattern, prerenderer) {
    this._prerenderers.push(this._createPrerenderFunction(pattern, prerenderer));
  }

  renderPage (page) {
    var _timer = this.logger.time();
    return this._prerenderPage(page)
      .then(page => this._renderPage(page))
      .then(result => {
        this.logger.info(`Rendered ${page.url} (${page.src}) in ${this.logger.timeEnd(_timer)}`);
        return result;
      });
  }

  invalidateTemplate (name) {
    name = name.replace(path.extname(name), '');
    this.nunjucks.loaders[0].emit('update', name);
    this.nunjucks.loaders[0].emit('update', `${name}.md`);
    this.nunjucks.loaders[0].emit('update', `${name}.html`);
  }

  helper (name, handler, defaults) {
    this.nunjucks.addExtension(name, new Helper(name, handler, defaults));
  }

  block (name, handler, defaults) {
    this.nunjucks.addExtension(name, new Block(name, handler, defaults));
  }

  filter (name, handler) {
    this.nunjucks.addFilter(name, function (...args) {
      let result;

      try {
        result = handler.apply(undefined, args);
      } catch (e) {
        throw new CustomHelperError('filter', name, e);
      }

      return new nunjucks.runtime.SafeString(result);
    });
  }

  global (name, value) {
    this.nunjucks.addGlobal(name, value);
  }

  _renderPage (page) {
    if (page.__isMarkdown) {
      return this._renderMarkdown(page.template)
        .then((output) => {
          return this._renderNunjucks(page.layout, output, page);
        });
    }

    return this._renderNunjucks(page.layout, page.template, page);
  }

  _renderMarkdown (markdown) {
    return new Promise((resolve) => {
      process.nextTick(() => {
        resolve(_.trim(this.markdown.render(markdown)));
      });
    });
  }

  _renderNunjucks (layout, template, page) {
    return new Promise((resolve, reject) => {
      if (layout) {
        let [layoutTemplate, block] = layout.split(':');
        template = `{% extends '${layoutTemplate}' %}{% block ${block} %}${template}{% endblock %}`;
      }

      this.nunjucks.renderString(template, page, (error, html) => {
        if (error) {
          reject(new PageRenderError(error, page));
        }
        resolve(_.trim(html));
      });
    });
  }

  _prerenderPage (page) {
    return new Promise((resolve, reject) => {
      const iterator = (page, prerenderer, callback) => {
        prerenderer(Object.assign({}, page), callback);
      };

      const done = (error, page) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(page);
      };

      async.reduce(this._prerenderers, page, iterator, done);
    });
  }
}

module.exports = Renderer;
