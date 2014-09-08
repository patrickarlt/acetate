var test = require('tape');

// unit tests for the watcher

test('timing test', function (t) {
  t.plan(1);

  t.equal(typeof Date.now, 'function');
});