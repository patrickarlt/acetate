function config(press) {
  press.global('config', {
    environment: 'dev'
  });

  press.global('rootUrl', 'http://site.com');

  press.metadata('page-with-external-data*', {
    data: ['moarData']
  });

  press.ignore('ignore-me.html');

  press.collection('blog', 'posts/**/*');

  press.layout('**/*', 'layouts/_layout:content');
  press.layout('posts/**/*', 'layouts/_post:post');
}

config.options = {
  src: 'src'
}

module.exports = config;