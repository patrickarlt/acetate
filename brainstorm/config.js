var blog = require('press-blog');

module.exports = function (press) {
    // Options
    // press.build;
    // press.data;
    // press.source;
    // press.watch;
    // press.root;
    // press.extensions;
    // press.logLevel;
    // press.nunjucks;
    // press.marked;

    // add arbitrary metadata to pages
    press.metadata('downloads/*', {
      layout: 'downloads'
    });

    // add arbitrary metadata to pages
    press.metadata('blog/**/*', {
      block: 'post'
    });

    // add arbitrary metadata to pages
    press.metadata('meta/**/*', {
      data: ['github']
    });

    press.ignore('these/pages/**/*');


    // would be accessible as {{blog.sorted}} for this collection sorted by key and {{blog.grouped}} for this collection grouped by unique values of key
    // collections be added to other pages with the metadata `collections` property
    // page in a collection would have {{blog.next}} and {{blog.previous}} variables
    press.collect('blog/posts/**/*', {
      id: 'blog',
      sortBy: 'date'
    });

    // collections can also be grouped as well as sorted. If grouping and sorting are enabled pages are sorted inside each group
    // pages still have {{androidGuides.next}} and {{androidGuides.previous}} but are limited inside their groups
    press.collect('these/android/pages/**/*', {
      label: 'androidGuides',
      groupBy: 'group',
      sortBy: 'difficulty'
    });

    press.use(blog(options));

    press.use(function(press){
      for (var i = press.data.someData.length - 1; i >= 0; i--) {
        press.createPage({
          metadata: {

          },
          template: 'path/to/template.html',
          path: 'the/output/path/of/the/file'
        });
      }

      return press;
    });

    return press;
};