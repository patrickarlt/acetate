var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var yaml = require('js-yaml');
var async = require('async');
var chokidar = require('chokidar');

module.exports = function (acetate, next){
  acetate.log.verbose('extension', 'adding data to pages');

  var cache = {};

  function handler(filepath) {
    // get the path of the data file relative to the source folder
    var relativepath = filepath.replace(path.join(process.cwd(),acetate.src) + '/', '');

    acetate.log.info('data', '%s changed', relativepath);

    delete cache[relativepath];

    // find all pages with this data file
    var pages = _.filter(acetate.pages, function(page){
      return  page.data && _.contains(page.data, relativepath);
    });

    function pushPage(error, page){
      acetate.pages.push(page);
    }

    // rebuild each of those pages
    if(pages.length){
      acetate.log.info('data', 'rebuilding %d pages useing %s', pages.length, relativepath);
      for (var i = pages.length - 1; i >= 0; i--) {
        var dirtyPage = _.remove(acetate.pages, {src: pages[i].src})[0];

        if(dirtyPage){
          dirtyPage._clean();

          acetate.loadPage(path.join(acetate.root, acetate.src,dirtyPage.src), pushPage);
        }
      }
      acetate.build();
    }
  }

  // watch everything in the source folder that looks like a data file
  var watcher = chokidar.watch(path.join(acetate.root, acetate.src,  '**/*.+(js|json|yaml|yml)'), {
    ignoreInitial: true
  })
  .on('change', handler)
  .on('add', handler)
  .on('unlink', handler);

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
      });
    } catch (e) {
      acetate.log.error('data', 'error thrown loading %s - %s', filepath, e.message || e);
      acetate.log.stacktrace(e.stack);
      acetate.buildStatus('error');
    }
    callback(null, data);
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

  async.each(acetate.pages, function(page, loaded){
    if(page.data){
      async.parallel(_.mapValues(page.data , function(filepath) { return _.partial(loadData, filepath); }), function(error, pageData){
        _.merge(page, pageData);
        loaded();
      });
    } else {
      loaded();
    }
  }, next);
};