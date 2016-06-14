const path = require('path');
const uuid = require('node-uuid');
const promisify = require('es6-promisify');

const copy = promisify(require('ncp').ncp);
const mkdirp = promisify(require('mkdirp'));

const fixtures = path.join(__dirname, 'fixtures');
const tempFixtures = path.join(path.resolve(__dirname, '../'), '.acetate_fixtures');

module.exports.createTempFixtures = function createTempFixtures (t) {
  const id = uuid();
  const temp = path.join(tempFixtures, id);
  t.context.temp = temp;
  return mkdirp(tempFixtures).then(() => copy(fixtures, temp));
};
