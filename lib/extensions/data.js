var _ = require('lodash');
var path = require('path');
var acetateUtils = require('../utils');
var fs = require('fs');
var yaml = require('js-yaml');
var async = require('async');
var gaze = require('gaze');

module.exports = function (acetate, next){
  acetate.log.debug('extension', 'adding data to pages');

  // watch everything in the source folder that looks like a data file
  gaze(path.join(acetate.src, '**/*.+(js|json|yaml|yml)'), function(error, watcher){
    watcher.on('all', function(event, filepath){
      // get the path of the data file relative to the source folder
      relativepath = filepath.replace(path.join(process.cwd(),acetate.src) + path.sep, '');

      // find all pages with this data file
      var pages = _.filter(acetate.pages, function(page){
        return  page.data && _.contains(page.data, relativepath);
      });

      // rebuild each of those pages
      if(pages.length){
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

  function loadData(filepath, callback) {
    var ext = path.extname(filepath);

    filepath = path.join(acetate.root, acetate.src, filepath)

    if(ext === '.js') {
      parseModuleData(filepath, callback);
      return;
    }

    if(ext === '.json') {
      parseJsonData(filepath, callback);
      return;
    }

    if(ext === '.yaml' || ext === '.yml') {
      parseYamlData(filepath, callback);
      return;
    }

    // callback with an error
    callback('Data file not found');
  };

  function parseYamlData(filepath, callback){
    fs.readFile(filepath, function(error, content){
      if(error){
        // @TODO warn about load error
        callback(null, {});
        return null;
      }

      var data = {};

      try {
        data = yaml.safeLoad(content.toString(), {
          strict: true
        });
      } catch (e) {
        // @TODO warn about load error
        console.log("yaml error!" + e);
      }
      callback(null, data);
    });
  };

  function parseModuleData(filepath, callback){
    if(require.cache[filepath]){
      delete require.cache[filepath];
    }
    try{
      require(filepath)(function(error, data){
        data = data || {};
        if(error){
          // @TODO warn about error
        }
        callback(error, data);
      });
    } catch (e) {
      // @TODO warn about data load error
    }
  };

   function parseJsonData(filepath, callback){
    fs.readFile(filepath, function(error, content){
      if(error){
        // @TODO warn about load error
        callback(null, {});
        return null;
      }

      var data = {};

      try {
        data = JSON.parse(content.toString());
      } catch (e) {
        // @TODO warn about error
        console.log('JSON Error');
      }

      callback(error, data);
    });
  };

  async.each(acetate.pages, function(page, loaded){
    if(page.data){
      async.parallel(_.mapValues(page.data , function(filepath) { return _.partial(loadData, filepath) }), function(error, pageData){
        _.merge(page, pageData);
        loaded();
      });
    } else {
      loaded();
    }
  }, next);

};