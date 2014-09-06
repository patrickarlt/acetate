module.exports = function (acetate) {
  acetate.global('config', {
    environment: 'dev'
  });

  acetate.global('rootUrl', 'http://site.com');

  acetate.ignore('ignore-me.html');

  acetate.collection('blog', 'posts/**/*');

  acetate.layout('**/*', 'layouts/_layout:content');
  acetate.layout('posts/**/*', 'layouts/_post:post');
};