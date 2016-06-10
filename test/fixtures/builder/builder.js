const Acetate = require('../../../lib/Acetate');
const builder = require('../../../lib/builder');

var acetate = new Acetate({
  logLevel: 'debug'
});

builder(acetate);
