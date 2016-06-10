const test = require('ava');
const { createTempFixtures, removeTempFixtures } = require('./util.js');

test.beforeEach(createTempFixtures);
test.afterEach(removeTempFixtures);

test.todo('should start a basic server');
