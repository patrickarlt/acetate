var glob = require('glob');
var path = require('path');
var fs = require('fs');
var util = require('util');
var _ = require('lodash');
var nunjucks = require('nunjucks');
var hljs = require('highlight.js');

module.exports = function (acetate) {
  function customTagError (name, type, e) {
    var error = acetate.util.parseException(e);
    e.message = util.format('error in custom %s "%s" - %s:%d:%d', type, name, error.path, error.lineNo, error.colNo);
    return e;
  }

  var Loader = nunjucks.Loader.extend({
    getSource: function (name) {
      acetate.debug('nunjucks', 'searching for templates named %s', name);

      var matches = glob.sync(name + '.+(html|md|markdown)', {
        cwd: path.join(acetate.src)
      });

      acetate.debug('nunjucks', 'found %d template(s) matching %s', matches.length, name);

      if (matches && matches[0]) {
        var fullpath = path.join(acetate.src, matches[0]);

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

        // parse the args and move after the block end. passing true
        // as the second arg is required if there are no parentheses
        args = parser.parseSignature(null, true);

        // You must include this if there are no args to prevent errors
        if (args.children.length === 0) {
          args.addChild(new nodes.Literal(0, 0, ''));
        }

        parser.advanceAfterBlockEnd(token.value);

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
          throw customTagError(name, 'helper', e);
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
          throw customTagError(name, 'block', e);
        }

        return result;
      };
    }

    environment.addExtension(name, new CustomBlock());
  }

  function filter (name, fn) {
    var wrapped = _.bind(function (value) {
      var result;
      try {
        result = fn(value);
      } catch (e) {
        throw customTagError(name, 'filter', e);
      }

      return result;
    }, this);

    environment.addFilter(name, wrapped);
  }

  function global (key, value) {
    environment.addGlobal(key, value);
  }

  block('highlight', function (context, body, lang) {
    var code = body;
    var highlighted = (lang) ? hljs.highlight(lang, code) : hljs.highlightAuto(body);

    return new nunjucks.runtime.SafeString('<pre><code class="' + highlighted.language + '">' + highlighted.value.trim() + '</code></pre>');
  });

  block('markdown', function (context, body) {
    return new nunjucks.runtime.SafeString(acetate.markdown.render(body));
  });

  helper('debug', function (context, variable) {
    var output;
    var template;

    if (variable === '*') {
      acetate.info('debugger', '%s: %s is %s', context.src, variable, JSON.stringify(context, null, 2));
      template = '<script>if(console && console.info) {console.info("Acetate Debugger: `{{variable}}` is", ({{context | safe}}));}</script>';
    } else {
      acetate.info('debugger', '%s: %s is %s', context.src, variable, context[variable]);
      template = '<script>if(console && console.info) {console.info("Acetate Debugger: `{{variable}}` is", "`"+({{context | safe}})["{{variable}}"]+"`");}</script>';
    }

    output = acetate.nunjucks.renderString(template, {
      variable: variable,
      context: JSON.stringify(context)
    });

    return new nunjucks.runtime.SafeString(output);
  });

  return {
    nunjucks: environment,
    helper: helper,
    block: block,
    filter: filter,
    global: global
  };
};
