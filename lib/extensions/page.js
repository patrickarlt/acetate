var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var Page = require('../page');
var templatecache = {};

function GeneratePage(templatepath, url, extraMetadata){
  return function(acetate, callback){
    function createPage(template){
      var metadata = _.merge({
        __metadataLines: 0,
        __originalMetadata: extraMetadata,
        __dirty: true,
        url: url,
        src: templatepath,
        dest: (path.extname(url) ? url : (url + '/index.html')).replace(/\/+/, '/'),
      }, extraMetadata);
      acetate.pages.push(new Page(template, metadata, acetate));
      callback(null, acetate);
    }

    if(templatecache[templatepath]){
      createPage(templatecache[templatepath]);
    } else {
      fs.readFile(path.join(acetate.root, acetate.src, templatepath), function(error, content){
        templatecache[templatepath] = content.toString();
        createPage(templatecache[templatepath]);
      });
    }
  }
}

module.exports = GeneratePage;