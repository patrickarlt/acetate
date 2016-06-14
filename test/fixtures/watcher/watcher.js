const Acetate = require('../../../lib/Acetate');
const watcher = require('../../../lib/modes/watcher');

var acetate = new Acetate({
  logLevel: 'debug'
});

watcher(acetate);
