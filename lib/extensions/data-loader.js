var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var yaml = require('js-yaml');
var async = require('async');
var chokidar = require('chokidar');

// load global + local data and bind everything and watch
module.exports = function (options) {
  return function(acetate, callback){
    var cache = {};
    var watcher;

    acetate._data = acetate._data || {};

    // loop over each page
    _.each(acetate.pages, function(page){
      // each local data definition
      _.each(page.__originalMetadata.data, function(source, name){
        // this is the first time we have seem this source file
        if(!acetate._data[source]){
          acetate._data[source] = {
            fullpath: path.join(acetate.root, acetate.src, source),
            global: false,
            locals: []
          };
        }

        // push a local definition
        acetate._data[source].locals.push({
          name: name,
          page: page
        });
      });
    });

    // now that we have all our data references clear `data` key from every page so we can reassign it.
    _.each(acetate.pages, function(page){
      page.data = {};
    });

    function cacheResult(key, callback){
      return function(error, data){
        cache[key] = data;
        callback(error, data);
      };
    }

    function loadData(filepath, callback) {
      var ext = path.extname(filepath);

      if(cache[filepath]){
        acetate.log.debug('data', '%s loaded from cache', filepath);
        callback(null, cache[filepath]);
      }

      if(ext === '.js') {
        parseModuleData(filepath, cacheResult(filepath, callback));
      }

      if(ext === '.json') {
        parseJsonData(filepath, cacheResult(filepath, callback));
      }

      if(ext === '.yaml' || ext === '.yml') {
        parseYamlData(filepath, cacheResult(filepath, callback));
      }
    }

    function parseYamlData(filepath, callback){
      var fullpath = path.join(acetate.root, acetate.src, filepath);
      var data = {};

      fs.readFile(fullpath, function(error, content){
        if(error){
          acetate.log.warn('data', 'error reading %s - %s', filepath, error);
          acetate.buildStatus('warn');
          callback(error, {});
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
    }

    function parseModuleData(filepath, callback){
      var fullpath = path.join(acetate.root, acetate.src, filepath);
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
          callback(null, data);
        });
      } catch (e) {
        acetate.log.error('data', 'error thrown loading %s - %s', filepath, e.message || e);
        acetate.log.stacktrace(e.stack);
        acetate.buildStatus('error');
        callback(null, {});
      }
    }

    function parseJsonData(filepath, callback){
      var fullpath = path.join(acetate.root, acetate.src, filepath);

      var data = {};

      fs.readFile(fullpath, function(error, content){
        if(error){
          acetate.log.warn('data', 'error reading %s - %s', filepath, error);
          acetate.buildStatus('warn');
          callback(error, {});
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
    }

    // bind local definitions first then define global definitions if they dont extist
    function bindData(){
      // bind all local data
      _.each(acetate._data, function(data){
        _.each(data.locals, function(def){
          var page = def.page;
          var name = def.name;
          page.data[name] = data.value;
        });
      });

      // bind all global data
      _.each(acetate._data, function(data){
        if(data.global){
          _.each(acetate.pages, function(page){
            if(!page.data[data.global]){
              Object.defineProperty(page.data, data.global, {
               configurable: true,
                get: function(){
                  if(!_.include(data.using, page)){
                    data.using.push(page);
                  }
                  return data.value;
                }
              });
            }
          });
        }
      });

      callback(undefined, acetate);
    }

    // build a map of things for async parallel to load all the data
    var tasks = _.mapValues(acetate._data, function(value, key){
      return _.partial(loadData, key);
    });

    // load data and then add the data to the 'value' on the data object
    async.parallel(tasks, function(error, results){
      _.each(results, function(result, key){
        acetate._data[key].value = result;
      });

      // finally bind all our data to pages
      bindData();
    });

    // if we are running the watcher
    if (options.server || options.watcher){
      if(watcher) {
        watcher.close();
      }

      // build a new watcher
      var files = _.pluck(acetate._data, 'fullpath');

      watcher = chokidar.watch(files, {
        ignoreInital: true
      }).on('raw', function(event, path, details){
        _(acetate._data).where({ fullpath: path }).each(function(data){
          _.each(data.using, function(page){
            page.__dirty = true;
          });

          _.each(data.locals, function(local){
            local.page.__dirty = true;
          });
        });
      });
    }
  };
};