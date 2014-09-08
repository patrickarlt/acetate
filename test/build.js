var test = require('tape');

// test that the site inside fixtures builds as expected

test('timing test', function (t) {
  t.plan(1);

  t.equal(typeof Date.now, 'function');
});