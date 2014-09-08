var test = require('tape');

// unit tests for all extensions

test('timing test', function (t) {
  t.plan(1);

  t.equal(typeof Date.now, 'function');
});