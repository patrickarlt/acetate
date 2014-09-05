var blog = require('acetate-blog');

module.exports = function (acetate) {
    // Options
    // acetate.build;
    // acetate.data;
    // acetate.source;
    // acetate.watch;
    // acetate.root;
    // acetate.extensions;
    // acetate.logLevel;
    // acetate.nunjucks;
    // acetate.marked;

    // add arbitrary metadata to pages
    acetate.metadata('downloads/*', {
      layout: 'downloads'
    });

    // add arbitrary metadata to pages
    acetate.metadata('blog/**/*', {
      block: 'post'
    });

    // add arbitrary metadata to pages
    acetate.metadata('meta/**/*', {
      data: ['github']
    });

    acetate.ignore('these/pages/**/*');


    // would be accessible as {{blog.sorted}} for this collection sorted by key and {{blog.grouped}} for this collection grouped by unique values of key
    // collections be added to other pages with the metadata `collections` property
    // page in a collection would have {{blog.next}} and {{blog.previous}} variables
    acetate.collect('blog/posts/**/*', {
      id: 'blog',
      sortBy: 'date'
    });

    // collections can also be grouped as well as sorted. If grouping and sorting are enabled pages are sorted inside each group
    // pages still have {{androidGuides.next}} and {{androidGuides.previous}} but are limited inside their groups
    acetate.collect('these/android/pages/**/*', {
      label: 'androidGuides',
      groupBy: 'group',
      sortBy: 'difficulty'
    });

    acetate.use(blog(options));

    acetate.use(function(acetate){
      for (var i = acetate.data.someData.length - 1; i >= 0; i--) {
        acetate.createPage({
          metadata: {

          },
          template: 'path/to/template.html',
          path: 'the/output/path/of/the/file'
        });
      }

      return acetate;
    });

    return acetate;
};