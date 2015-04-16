var test = require('tape');
var utils = require('../utils');
var acetate = require('../../../index.js');

var root = __dirname;

var site = acetate({
  log: 'debug',
  root: root,
  clean: true
});

var logs = [];

site.on('log', function (e) {
  logs.push(e);
});

site.once('clean', function () {
  logs = [];
});

site.once('build', function () {
  test('should build a page with data from a module', function (t) {
    t.plan(1);

    var output = 'build/dynamic-data/index.html';
    var expected = 'expected/dynamic-data.html';

    utils.equal(t, root, output, expected);
  });

  test('should build a page with data from a json file', function (t) {
    t.plan(1);

    var output = 'build/json-data/index.html';
    var expected = 'expected/json-data.html';

    utils.equal(t, root, output, expected);
  });

  test('should build a page with data from a yaml file', function (t) {
    t.plan(1);

    var output = 'build/yaml-data/index.html';
    var expected = 'expected/yaml-data.html';

    utils.equal(t, root, output, expected);
  });

  test('should build a page with data from a yml file', function (t) {
    t.plan(1);

    var output = 'build/yml-data/index.html';
    var expected = 'expected/yml-data.html';

    utils.equal(t, root, output, expected);
  });

  test('should build a page with global data from config file', function (t) {
    t.plan(1);

    var output = 'build/global-data/index.html';
    var expected = 'expected/global-data.html';

    utils.equal(t, root, output, expected);
  });

  test('should override global with a local declaration', function (t) {
    t.plan(1);

    var output = 'build/override-data/index.html';
    var expected = 'expected/override-data.html';

    utils.equal(t, root, output, expected);
  });

  test('should be able to require many data files', function (t) {
    t.plan(1);

    var output = 'build/all-data/index.html';
    var expected = 'expected/all-data.html';

    utils.equal(t, root, output, expected);
  });
});
