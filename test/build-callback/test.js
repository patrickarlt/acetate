var tap = require('tap');
var acetate = require('../../index');

tap.test('should run a callback after a build', function (t) {
  acetate({
    root: __dirname,
    log: 'silent'
  }, function (errors, warnings, status) {
    t.false(errors.length);
    t.false(warnings.length);
    t.equal(status, 'success');
    t.end();
  });
});
