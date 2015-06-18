var glob = require('glob');
var shelljs = require('shelljs');
var cover = process.argv.slice(2)[0] === '--cover';

glob('test/**/test.js', function (error, files) {
  if (error) {
    process.exit(1);
  }

  files.forEach(function (file) {
    var command = cover ? 'istanbul cover ./node_modules/tape/bin/tape --dir ./coverage/' + file.split('/')[1] + ' -- ' + file : 'tape ' + file;
    shelljs.exec(command);
  });
});
