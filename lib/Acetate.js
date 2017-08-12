const EventEmitter = require("events").EventEmitter;
const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const minimatch = require("minimatch");
const async = require("async");
const glob = require("glob");
const MarkdownIt = require("markdown-it");
const nunjucks = require("nunjucks");
const hljs = require("highlight.js");
const yaml = require("js-yaml");
const symlinkDir = require("symlink-dir");

const Logger = require("./Logger.js");
const TemplateLoader = require("./TemplateLoader.js");
const TransformerError = require("./error-types/TransformerError.js");
const AcetateConfigError = require("./error-types/AcetateConfigError.js");
const Helper = require("./custom-tags/Helper.js");
const Block = require("./custom-tags/Block.js");
const CustomHelperError = require("./error-types/CustomHelperError.js");
const PageRenderError = require("./error-types/PageRenderError.js");
const createPage = require("./createPage");
const { mergeMetadata, processTemplate } = require("./utils");

class Acetate extends EventEmitter {
  constructor(
    {
      config = "acetate.config.js",
      sourceDir = "src",
      outDir = "build",
      root = process.cwd(),
      log = "info",
      args = {}
    } = {}
  ) {
    super();

    this.args = args;
    this.root = root;
    this.config = config;
    this.src = sourceDir;
    this.dest = outDir;
    this.sourceDir = path.join(root, sourceDir);
    this.outDir = path.join(root, outDir);
    this.log = new Logger({
      level: log
    });

    this.initConfig();
  }

  /**
   * Transformer
   */

  transform(pattern, transformer, label) {
    const matcher = new minimatch.Minimatch(pattern);
    const transformRunner = function(page, done) {
      if (!matcher.match(page.src)) {
        process.nextTick(() => {
          done(null, page);
        });

        return;
      }

      // async transformer
      if (transformer.length === 2) {
        try {
          transformer(page, done);
        } catch (e) {
          done(e);
        }
      } else {
        var nextPage;
        var error;

        try {
          nextPage = transformer(page);
        } catch (e) {
          error = e;
        } finally {
          done(error, nextPage);
        }
      }
    };

    transformRunner.label = label;

    this._transformers.push(transformRunner);
  }

  metadata(pattern, data) {
    this.transform(pattern, function(page) {
      return mergeMetadata(page, data);
    });
  }

  layout(pattern, layout) {
    this.metadata(pattern, {
      layout
    });
  }

  ignore(pattern) {
    this.metadata(pattern, {
      ignore: true
    });
  }

  transformPage(page) {
    return new Promise((resolve, reject) => {
      const done = (e, page) => {
        if (e) {
          const error = new TransformerError(e);
          this.log.error(error);
          reject(error);
          return;
        }

        resolve(page);
      };

      const iterator = (page, transformer, callback) => {
        transformer(page, callback);
      };

      async.reduce(this._transformers, page, iterator, done);
    });
  }

  query(name, pattern, mapper, reducer, inital) {
    this._queries[name] = {
      name,
      pattern,
      mapper,
      reducer,
      inital,
      result: null
    };
  }

  data(name, data) {
    this._dataSources[name] = {
      name: name,
      source: data,
      lastRead: null,
      value: null
    };
  }

  _loadDataFromFunction(source, done) {
    source.source((error, data) => {
      if (error) {
        done(error);
        return;
      }

      done(null, data);
    });
  }

  _loadDataFromFile(source, done) {
    const datapath = path.join(this.sourceDir, source.source);

    if (
      source.value !== null &&
      source.lastRead > fs.statSync(datapath).mtimeMs
    ) {
      done(null, source.value);
      return;
    }

    fs.readFile(datapath, "utf8", (error, content) => {
      if (error) {
        done(error);
        return;
      }

      const ext = path.extname(datapath);
      let data;

      if (ext === ".json") {
        data = JSON.parse(content);
      }

      if (ext === ".yaml" || ext === ".yml") {
        data = yaml.safeLoad(content);
      }

      this._dataSources[source.name].value = data;
      this._dataSources[source.name].lastRead = Date.now();

      done(null, data);
    });
  }

  /**
   * Renderer
   */

  _createPrerenderFunction(pattern, prerenderer) {
    return function(page, done) {
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

  prerender(pattern, prerenderer) {
    this._prerenderers.push(
      this._createPrerenderFunction(pattern, prerenderer)
    );
  }

  renderPage(page) {
    var _timer = this.log.time();
    return this._prerenderPage(page)
      .then(page => this._renderPage(page))
      .then(result => {
        this.log.info(
          `Rendered ${page.url} (${page.src}) in ${this.log.timeEnd(_timer)}`
        );
        return result;
      });
  }

  helper(name, handler, defaults) {
    this.nunjucks.addExtension(name, new Helper(name, handler, defaults));
  }

  block(name, handler, defaults) {
    this.nunjucks.addExtension(name, new Block(name, handler, defaults));
  }

  filter(name, handler) {
    this.nunjucks.addFilter(name, function(...args) {
      let result;

      try {
        result = handler.apply(undefined, args);
      } catch (e) {
        throw new CustomHelperError("filter", name, e);
      }

      return new nunjucks.runtime.SafeString(result);
    });
  }

  global(name, value) {
    this.nunjucks.addGlobal(name, value);
  }

  _renderPage(page) {
    if (page.templatePath) {
      return this._loadTemplate(page.templatePath).then(template => {
        return this._renderTemplate(template, page);
      });
    }

    return this._renderTemplate(page.template, page);
  }

  _renderTemplate(template, page) {
    if (page.__isMarkdown) {
      return this._renderMarkdown(template).then(output => {
        return this._renderNunjucks(page.layout, output, page);
      });
    }

    return this._renderNunjucks(page.layout, template, page);
  }

  _renderMarkdown(markdown) {
    return new Promise(resolve => {
      process.nextTick(() => {
        resolve(_.trim(this.markdown.render(markdown)));
      });
    });
  }

  _loadTemplate(templatePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(templatePath, (error, content) => {
        if (error) {
          reject(error);
        }
        const { template } = processTemplate(content.toString());
        resolve(template);
      });
    });
  }

  _renderNunjucks(layout, template, page) {
    return new Promise((resolve, reject) => {
      if (layout) {
        let [layoutTemplate, block] = layout.split(":");
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

  _prerenderPage(page) {
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

  invalidateTemplate(name) {
    name = name.replace(path.extname(name), "");
    this.nunjucks.loaders[0].emit("update", name);
    this.nunjucks.loaders[0].emit("update", `${name}.md`);
    this.nunjucks.loaders[0].emit("update", `${name}.html`);
  }

  /**
   * Loader
   */

  symlink(src, dest) {
    this._loaders.unshift((createPage, callback) => {
      symlinkDir(path.join(this.root, src), path.join(this.sourceDir, dest))
        .then(result => {
          callback(null, []);
        })
        .catch(error => {
          callback(error);
        });
    });
  }

  load(pattern, { ignore = [], metadata = {}, basePath = "" } = {}) {
    this._paths.push(pattern);

    if (this._pageWatcher) {
      this._pageWatcher.add(pattern);
    }

    this._loaders.push(
      this._createLoaderTask(pattern, { ignore, metadata, basePath })
    );
    this._loaderMetadata[pattern] = { ignore, metadata };
  }

  getPages() {
    if (this._pagesLoaded) {
      return Promise.resolve(this._pages);
    }

    return this.loadPages();
  }

  loadPages() {
    return new Promise((resolve, reject) => {
      const iterator = (pages, loader, callback) => {
        try {
          loader(createPage, function(error, newPages) {
            if (error) {
              callback(error);
              return;
            }

            callback(error, pages.concat(newPages));
          });
        } catch (e) {
          callback(e);
        }
      };

      const done = (error, pages) => {
        if (error) {
          reject(error);
          return;
        }

        this._pagesLoaded = true;
        this._pages = pages;

        resolve(this._pages);
      };

      async.reduce(this._loaders, [], iterator, done);
    });
  }

  _createLoaderTask(
    pattern,
    { ignore = [], metadata = {}, basePath = "" } = {}
  ) {
    return (createPage, callback) => {
      var _timer = this.log.time();

      const done = (error, filepaths) => {
        if (error) {
          callback(error);
        }

        const pages = _(filepaths)
          .filter(filepath => {
            return path.basename(filepath)[0] !== "_";
          })
          .map(src => {
            return createPage.fromTemplate(
              src,
              path.join(this.sourceDir, src),
              metadata,
              { basePath }
            );
          })
          .value();

        Promise.all(pages)
          .then(pages => {
            this.log.info(
              `Loaded ${pages.length} pages in ${this.log.timeEnd(_timer)}`
            );
            callback(null, pages);
          })
          .catch(error => {
            this.log.error(error);
            callback(error, []);
          });
      };

      glob(
        pattern,
        {
          cwd: this.sourceDir,
          nodir: true,
          ignore
        },
        done
      );
    };
  }

  generate(generator) {
    this._loaders.push(generator);
  }

  /**
   * Watcher
   */

  startPageWatcher() {
    if (this._pageWatcher) {
      this.stopWatcher();
    }

    this._pageWatcher = chokidar.watch(this._paths, {
      cwd: this.sourceDir,
      ignoreInitial: true
    });

    this._pageWatcher.on("ready", () => {
      this.log.debug("File watcher ready");
      this.emit("watcher:ready");
    });

    this._pageWatcher.on("add", src => {
      src = src.replace(/\\+/g, "/");
      this._handlePageWatcherEvent(src, "add", "added");
    });

    this._pageWatcher.on("change", src => {
      src = src.replace(/\\+/g, "/");
      this._handlePageWatcherEvent(src, "change", "changed");
    });

    this._pageWatcher.on("unlink", src => {
      src = src.replace(/\\+/g, "/");
      if (path.basename(src)[0] === "_") {
        this.emit("watcher:template:delete", src);
      } else {
        const [removedPage] = _.remove(this._pages, page => page.src === src);
        if (removedPage) {
          this.log.info(`${src} deleted`);
          this.emit("watcher:delete", removedPage);
        }
      }
    });
  }

  stopPageWatcher() {
    this._pageWatcher.close();
    this._pageWatcher = null;
  }

  _handlePageWatcherEvent(src, eventName, verb) {
    this.log.info(`${src} ${verb}`);
    if (path.basename(src)[0] === "_") {
      this.emit(`watcher:template:${eventName}`, src);
    } else {
      setTimeout(() => {
        let loader = Object.keys(this._loaderMetadata).find(pattern => {
          let ignores = this._loaderMetadata[pattern].ignore || [];
          return minimatch(src, pattern) && ignores.length > 0
            ? ignores.every(pattern => !minimatch(src, pattern))
            : true;
        });
        let metadata = this._loaderMetadata[loader].metadata;

        Object.keys(this._queries).forEach(name => {
          const q = this._queries[name];
          if (minimatch(src, q.pattern)) {
            this._queries[q.name].result = null;
          }
        });

        this.log.debug(`Using metadata from loader:${loader}`);

        return createPage
          .fromTemplate(src, path.join(this.sourceDir, src), metadata)
          .then(page => {
            let oldPageIndex = this._pages.findIndex(page => page.src === src);

            if (oldPageIndex >= 0) {
              this._pages[oldPageIndex] = page;
            } else {
              this._pages.push(page);
            }

            this.emit(`watcher:${eventName}`, page);

            return page;
          })
          .catch(this._handlePageWatcherError.bind(this));
      }, 100);
    }
  }

  _handlePageWatcherError(error) {
    this._pagesLoaded = false;
    this._pages = [];
    this.log.error(error);
    this.emit("watcher:error", {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        file: error.file,
        line: error.line,
        column: error.column
      }
    });
  }

  /**
   * Config
   */

  initConfig() {
    this.log.info("Loading config file.");
    this.reloadConfig();
  }

  reloadConfig() {
    this.emit("config:reloading");
    this.reset();

    this.require("./helpers/highlight-block.js");
    this.require("./helpers/link-helper.js");
    this.require("./helpers/markdown-block.js");

    if (this.config) {
      try {
        // require new configs
        this.require(path.resolve(this.root, this.config));

        this.emit("config:loaded");
      } catch (e) {
        const error = new AcetateConfigError(e, this.root);
        this.log.error(error);
        this.emit("config:error", {
          error
        });
        throw error;
      }
    } else {
      this.emit("config:loaded");
    }

    this.require("./helpers/stats-transformer.js");

    this.prerender("**/*", (page, done) => {
      async.mapValues(
        this._queries,
        (q, name, callback) => {
          if (q.result !== null) {
            this.log.debug(`Using cached result for query:${q.name}`);
            callback(null, q.result);
            return;
          }

          this.log.debug(`Generating result for query:${q.name}`);
          this.getPages()
            .then(pages => {
              const matcher = new minimatch.Minimatch(q.pattern);
              return pages.filter(page => matcher.match(page.src));
            })
            .then(pages => {
              this.log.debug(`found ${pages.length} pages for query:${q.name}`);
              return Promise.all(pages.map(page => this.transformPage(page)));
            })
            .then(pages => {
              return _(pages)
                .map(q.mapper)
                .compact()
                .reduce(q.reducer, _.clone(q.inital));
            })
            .then(result => {
              this._queries[q.name].result = result;
              callback(null, result);
            })
            .catch(error => callback(error, null));
        },
        (error, data) => {
          if (error) {
            done(error, null);
            return;
          }

          page.queries = data;
          done(null, page);
        }
      );
    });

    this.prerender("**/*", (page, done) => {
      async.mapValues(
        this._dataSources,
        (source, name, callback) => {
          if (typeof source.source === "function") {
            this._loadDataFromFunction(source, callback);
            return;
          }

          this._loadDataFromFile(source, callback);
        },
        (error, data) => {
          if (error) {
            done(error, null);
            return;
          }

          page.data = data;
          done(null, page);
        }
      );
    });
  }

  require(configPath) {
    var fullPath;

    // resolve this path to node_modules or locally
    try {
      fullPath = require.resolve(configPath);
    } catch (e) {
      fullPath = path.resolve(this.root, configPath);
    }

    // add this path to the cache of config paths
    this._configPaths.push(fullPath);

    // make sure our new module isn't cached
    delete require.cache[fullPath];

    // require our new configuration
    this.use(require(fullPath));
  }

  use(plugin) {
    plugin(this);
  }

  reset() {
    this._paths = [];
    this._pages = [];
    this._pagesLoaded = false;
    this._loaders = [];
    this._loaderMetadata = {};
    this._transformers = [];
    this._configPaths = [];
    this._configLoaded = false;
    this._prerenderers = [];
    this._queries = {};
    this._dataSources = {};

    this._templateloader = new TemplateLoader({
      sourceDir: this.sourceDir,
      logger: this.log,
      errorHandler: error => {
        this.emit("renderer:error", {
          error
        });
        this.log.error(error);
      }
    });

    this.nunjucks = new nunjucks.Environment(this._templateloader);

    this.markdown = new MarkdownIt({
      html: true,
      linkify: true,
      langPrefix: "",
      highlight: function(code, lang) {
        if (lang === "text" || lang === "plain") {
          return code;
        }

        return lang
          ? hljs.highlight(lang, code).value
          : hljs.highlightAuto(code).value;
      }
    });
  }

  startWatcher() {
    if (this._configWatcher) {
      this.stopWatcher();
    }

    this._configWatcher = chokidar.watch(this._configPaths);

    this._configWatcher.on("ready", () => {
      this.emit("config:watcher:ready");
    });

    this._configWatcher.on("change", () => {
      this.log.info("Config file changed. Rebuilding configuration.");
      try {
        this.reloadConfig();
      } catch (e) {
        // nothing
      }
    });

    this.log.debug("Starting watcher.");

    this.startPageWatcher();
  }

  stopWatcher() {
    this._configWatcher.unwatch(this._configPaths);
    this._configWatcher.close();
    this.watcher = null;
    this.stopPageWatcher();
  }
}

module.exports = Acetate;
