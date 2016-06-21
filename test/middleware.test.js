const test = require('ava');
const path = require('path');
const Acetate = require('../lib/Acetate.js');
const { createTempFixtures } = require('./util.js');
const createAcetateMiddleware = require('../lib/modes/middleware.js');
const sinon = require('sinon');
const httpMocks = require('node-mocks-http');
const EventEmitter = require('events');

test.beforeEach(createTempFixtures);

test.beforeEach(t => {
  t.context.response = httpMocks.createResponse({
    eventEmitter: EventEmitter
  });
});

test.cb('should return a page when requested', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'middleware-basic'),
    log: 'silent'
  });

  const middleware = createAcetateMiddleware(acetate);

  const { response } = t.context;

  const request = httpMocks.createRequest({
    method: 'GET',
    url: '/index.html'
  });

  const next = sinon.spy();

  middleware(request, response, next);

  response.on('end', function () {
    t.is(next.callCount, 0);
    t.is(response._getData(), '<h1>index.html</h1>');
    t.is(response._getStatusCode(), 200);
    t.is(response._getHeaders()['Content-Type'], 'text/html');
    t.end();
  });
});

test.cb('should keep a cache of transformed pages by URL', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'middleware-basic'),
    log: 'silent'
  });

  const middleware = createAcetateMiddleware(acetate);

  const { response } = t.context;

  const request = httpMocks.createRequest({
    method: 'GET',
    url: '/index.html'
  });

  const next = sinon.spy();

  middleware(request, response, next);

  response.on('end', function () {
    const cachedPages = middleware.getPageCache();
    t.is(cachedPages['/'].src, 'index.html');
    t.end();
  });
});

test.cb('should normalize request URLs to find matching pages', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'middleware-basic'),
    log: 'silent'
  });

  const middleware = createAcetateMiddleware(acetate);

  const { response } = t.context;

  const request = httpMocks.createRequest({
    method: 'GET',
    url: '/'
  });

  const next = sinon.spy();

  middleware(request, response, next);

  response.on('end', function () {
    t.is(next.callCount, 0);
    t.is(response._getData(), '<h1>index.html</h1>');
    t.is(response._getStatusCode(), 200);
    t.is(response._getHeaders()['Content-Type'], 'text/html');
    t.end();
  });
});

test.cb('should pass though if no page is found', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'middleware-basic'),
    log: 'silent'
  });

  const middleware = createAcetateMiddleware(acetate);

  const { response } = t.context;

  const request = httpMocks.createRequest({
    method: 'GET',
    url: '/does-not-exist.html'
  });

  middleware(request, response, () => {
    t.pass();
    t.end();
  });
});

test.cb('should return early on non GET requests', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'middleware-basic'),
    log: 'silent'
  });

  const middleware = createAcetateMiddleware(acetate);

  const { response } = t.context;

  const request = httpMocks.createRequest({
    method: 'POST',
    url: '/some-path'
  });

  middleware(request, response, () => {
    t.pass();
    t.end();
  });
});

test.cb('should return an error page if there is an error rendering the page', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'middleware-render-error'),
    log: 'silent'
  });

  const middleware = createAcetateMiddleware(acetate);

  const { response } = t.context;

  const request = httpMocks.createRequest({
    method: 'GET',
    url: '/'
  });

  const next = sinon.spy();

  middleware(request, response, next);

  response.on('end', function () {
    t.is(next.callCount, 0);
    t.truthy(response._getData());
    t.is(response._getStatusCode(), 500);
    t.is(response._getHeaders()['Content-Type'], 'text/html');
    t.end();
  });
});

test.cb('should return an error page if there is an error transforming the page', t => {
  const acetate = new Acetate({
    root: path.join(t.context.temp, 'middleware-transform-error'),
    log: 'silent'
  });

  const middleware = createAcetateMiddleware(acetate);

  const { response } = t.context;

  const request = httpMocks.createRequest({
    method: 'GET',
    url: '/'
  });

  const next = sinon.spy();

  middleware(request, response, next);

  response.on('end', function () {
    t.is(next.callCount, 0);
    t.truthy(response._getData());
    t.is(response._getStatusCode(), 500);
    t.is(response._getHeaders()['Content-Type'], 'text/html');
    t.end();
  });
});

test.todo('should emit a warning when 2 or more pages with the same url are detected');

test.todo('should emit a warning when rendering an ignored page');
