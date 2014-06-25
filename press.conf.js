module.exports = function (press) {
  press.metadata('page-with-external-data*', {
    data: ['moarData']
  });

  press.ignore('ignore-me.html');

  press.layout('**/*', 'layouts/_layout:content');
};