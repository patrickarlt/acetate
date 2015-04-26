var glob = require('glob');
var path = require('path');
var fs = require('fs');
var util = require('util');
var _ = require('lodash');
var nunjucks = require('nunjucks');
var hljs = require('highlight.js');

module.exports = function (acetate) {
  var Loader = nunjucks.Loader.extend({
    getSource: function (name) {
      if (!name) {
        return null;
      }

      acetate.debug('nunjucks', 'searching for templates named %s', name);

      var matches = glob.sync(name + '.+(html|md|markdown)', {
        cwd: path.join(acetate.root, acetate.src)
      });

      acetate.debug('nunjucks', 'found %d template(s) matching %s', matches.length, name);

      if (matches && matches[0]) {
        var fullpath = path.join(acetate.root, acetate.src, matches[0]);

        acetate.debug('nunjucks', 'loading %s', fullpath);

        return {
          src: fs.readFileSync(fullpath, 'utf-8').split(/^([\s\S]+)^-{3}$/m)[0],
          path: fullpath
        };
      } else {
        acetate.warn('nunjucks', 'could not find a template named %s', name);
        return null;
      }
    }
  });

  var environment = new nunjucks.Environment(new Loader());

  function helper (name, fn) {
    function CustomTag () {
      this.tags = [name];

      this.parse = function (parser, nodes) {
        // get the tag token
        var token = parser.nextToken();
        var args;

        if (parser.peekToken().type === 'block-end') {
          throw new Error('You must pass at least one parameter to custom helper "' + name + '"');
        } else {
          // parse the args and move after the block end. passing true
          // as the second arg is required if there are no parentheses
          args = parser.parseSignature(null, true);

          // advance the parser past the end of the block
          parser.advanceAfterBlockEnd(token.value);
        }

        // See above for notes about CallExtension
        return new nodes.CallExtension(this, 'run', args);
      };

      this.run = function () {
        var args = Array.prototype.slice.call(arguments);
        args[0] = args[0].ctx;
        var result;

        try {
          result = fn.apply(this, args);
        } catch (e) {
          var error = acetate.util.parseException(e);
          e.message = util.format('error in custom helper "%s" - %s:%d:%d', name, error.path, error.lineNo, error.colNo);
          throw e;
        }

        return result;
      };
    }

    environment.addExtension(name, new CustomTag());
  }

  function block (name, fn) {
    function CustomBlock () {
      this.tags = [name];

      this.parse = function (parser, nodes) {
        // get the tag token
        var token = parser.nextToken();

        // parse the args and move after the block end. passing true
        // as the second arg is required if there are no parentheses
        var args = parser.parseSignature(null, true);

        parser.advanceAfterBlockEnd(token.value);

        // parse the body
        var body = parser.parseUntilBlocks('end' + name);

        parser.advanceAfterBlockEnd();

        // See above for notes about CallExtension
        return new nodes.CallExtension(this, 'run', args, [body]);
      };

      this.run = function () {
        var args = Array.prototype.slice.call(arguments);
        var context = args.shift().ctx;
        var body = (args.pop())();

        var params = [context, body].concat(args); // body, context, args...
        var result;

        try {
          result = fn.apply(this, params);
        } catch (e) {
          var error = acetate.util.parseException(e);
          e.message = util.format('error in custom block "%s" - %s:%d:%d', name, error.path, error.lineNo, error.colNo);
          throw e;
        }

        return result;
      };
    }

    environment.addExtension(name, new CustomBlock());
  };

  function filter (name, fn) {
    var wrapped = _.bind(function (value) {
      var result;
      try {
        result = fn(value);
      } catch (e) {
        var error = acetate.util.parseException(e);
        e.message = util.format('error in custom filter "%s" - %s:%d:%d', name, error.path, error.lineNo, error.colNo);
        throw e;
      }

      return result;
    }, this);

    environment.addFilter(name, wrapped);
  };

  function global (key, value) {
    environment.addGlobal(key, value);
  };

  block('highlight', function (context, body, lang) {
    var code = body;
    var highlighted = (lang) ? hljs.highlight(lang, code) : hljs.highlightAuto(body);

    return '<pre><code class="hljs ' + highlighted.language + '">' + highlighted.value.trim() + '</code></pre>';
  });

  block('markdown', function (context, body) {
    return acetate.markdown.render(body);
  });

  return {
    nunjucks: environment,
    helper: helper,
    block: block,
    filter: filter,
    global: global
  };
};
