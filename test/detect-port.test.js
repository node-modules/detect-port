'use strict';

const assert = require('assert');
const net = require('net');
const detectPort = require('..');

describe('detect port test', () => {
  let server;
  before(done => {
    server = new net.Server();
    server.listen(7001, done);
  });
  after(() => {
    server.close();
  });

  it('get random port', done => {
    detectPort((_, port) => {
      assert(port >= 1024 && port < 65535);
      done();
    });
  });

  it('callback with occupied port', done => {
    const _port = 80;
    detectPort(_port, (_, port) => {
      assert(port >= _port && port < 65535);
      done();
    });
  });

  it('work with listening port', done => {
    const port = 7001;
    detectPort(port, (_, realPort) => {
      assert(realPort !== 7001);
      assert(realPort > 0);
      done();
    });
  });

  it('callback with string arg', done => {
    const _port = '8080';
    detectPort(_port, (_, port) => {
      assert(port >= 8080 && port < 65535);
      done();
    });
  });

  it('callback with wrong arguments', done => {
    detectPort('oooo', (_, port) => {
      assert(port > 0);
      done();
    });
  });

  it('generator usage', function* () {
    const _port = 8080;
    const port = yield detectPort(_port);
    assert(port >= _port && port < 65535);
  });

  it('promise usage', done => {
    const _port = 8080;
    detectPort(_port)
      .then(port => {
        assert(port >= _port && port < 65535);
        done();
      })
      .catch(done);
  });

  it('promise with wrong arguments', done => {
    detectPort()
      .then(port => {
        assert(port > 0);
        done();
      })
      .catch(done);
  });

  it('generator with wrong arguments and return random port', function* () {
    const port = yield detectPort('oooo');
    assert(port > 0);
    assert(typeof port === 'number');
  });
});
