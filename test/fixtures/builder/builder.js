const Acetate = require('../../../lib/Acetate');
const builder = require('../../../lib/modes/builder');

var acetate = new Acetate({
  logLevel: 'debug'
});

builder(acetate);
