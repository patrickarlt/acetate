const Acetate = require('../../../lib/Acetate');
const createServer = require('../../../lib/server');

var acetate = new Acetate({
  logLevel: 'debug'
});

createServer(acetate);
