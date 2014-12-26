var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var yaml = require('js-yaml');
var async = require('async');
var gaze = require('gaze');

module.exports = function (acetate, next){
  acetate.log.verbose('extension', 'adding data to pages');

  var cache = {};

  // watch everything in the source folder that looks like a data file
  gaze(path.join(acetate.src, '**/*.+(js|json|yaml|yml)'), function(error, watcher){
    watcher.on('all', function(event, filepath){
      // get the path of the data file relative to the source folder
      relativepath = filepath.replace(path.join(process.cwd(),acetate.src) + path.sep, '');

      acetate.log.info('data', '%s changed', relativepath);

      delete cache[relativepath];

      // find all pages with this data file
      var pages = _.filter(acetate.pages, function(page){
        return  page.data && _.contains(page.data, relativepath);
      });

      // rebuild each of those pages
      if(pages.length){
        acetate.log.info('data', 'rebuilding %d pages useing %s', pages.length, relativepath);
        for (var i = pages.length - 1; i >= 0; i--) {
          var dirtyPage = _.remove(acetate.pages, {template: pages[i].template})[0];

          if(dirtyPage){
            dirtyPage.clean();
          }

          acetate.loadPage(dirtyPage.template, function(error, page){
            acetate.pages.push(page);
          });
        };
        acetate.build();
      }
    });
  });

  function cacheResult(key, callback){
    return function(error, data){
      cache[key] = data;
      callback(error, data);
    }
  }

  function loadData(filepath, callback) {
    var ext = path.extname(filepath);

    if(cache[filepath]){
      acetate.log.debug('data', '%s loaded from cache', filepath);
      callback(null, cache[filepath])
      return;
    }

    if(ext === '.js') {
      parseModuleData(filepath, cacheResult(filepath, callback));
      return;
    }

    if(ext === '.json') {
      parseJsonData(filepath, cacheResult(filepath, callback));
      return;
    }

    if(ext === '.yaml' || ext === '.yml') {
      parseYamlData(filepath, cacheResult(filepath, callback));
      return;
    }

    // callback with an error
    callback('Data file not found');
  };

  function parseYamlData(filepath, callback){
    var fullpath = path.join(acetate.root, acetate.src, filepath)
    var data = {};

    fs.readFile(fullpath, function(error, content){
      if(error){
        acetate.log.warn('data', 'error reading %s - %s', filepath, e);
        acetate.buildStatus('warn');
        callback(null, {});
        return null;
      }

      try {
        data = yaml.safeLoad(content.toString(), {
          strict: true
        });
      } catch (e) {
        acetate.log.warn('data', 'invalid YAML in %s', filepath);
        acetate.buildStatus('warn');
      }

      callback(null, data);
    });
  };

  function parseModuleData(filepath, callback){
    var fullpath = path.join(acetate.root, acetate.src, filepath)
    var data = {};

    if(require.cache[fullpath]){
      delete require.cache[fullpath];
    }

    try{
      require(fullpath)(function(error, result){
        data = result;
        if(error){
          acetate.log.error('data', 'error loading %s - %s', filepath, error);
          acetate.buildStatus('error');
        }
      });
    } catch (e) {
      acetate.log.error('data', 'error thrown loading %s - %s', filepath, e.message || e);
      acetate.log.stacktrace(e.stack);
      acetate.buildStatus('error');
    }
    callback(null, data);
  };

  function parseJsonData(filepath, callback){
    var fullpath = path.join(acetate.root, acetate.src, filepath)
    var data = {};

    fs.readFile(fullpath, function(error, content){
      if(error){
        acetate.log.warn('data', 'error reading %s - %s', filepath, e);
        acetate.buildStatus('warn');
        callback(null, {});
        return null;
      }

      try {
        data = JSON.parse(content.toString());
      } catch (e) {
        acetate.log.warn('data', 'invalid JSON in %s', filepath);
        acetate.buildStatus('warn');
      }

      callback(null, data);
    });
  };

  async.each(acetate.pages, function(page, loaded){
    if(page.metadata.data){
      async.parallel(_.mapValues(page.metadata.data , function(filepath) { return _.partial(loadData, filepath) }), function(error, pageData){
        _.merge(page.metadata, pageData);
        loaded();
      });
    } else {
      loaded();
    }
  }, next);

};