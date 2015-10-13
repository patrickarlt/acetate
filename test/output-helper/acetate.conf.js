module.exports = function (acetate) {
  acetate.output({
    dest: 'inline.html',
    nunjucks: '{{foo}}',
    metadata: {
      foo: 'foo'
    }
  });

  acetate.ignore('external-template.html');

  acetate.output({
    dest: 'external.html',
    template: 'external-template.html',
    metadata: {
      foo: 'foo'
    }
  });

  acetate.output({
    dest: 'markdown.html',
    markdown: '# Foo'
  });
};
