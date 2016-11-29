'use strict';

const detectPort = require('..');

describe('detect port test', () => {

  it('callback with occupied port', done => {
    const _port = 80;
    detectPort(_port, (err, port) => {
      if (err) {
        console.log(err);
      }
      port.should.within(_port, 65535);
      done();
    });
  });

  it('callback with string arg', done => {
    const _port = '8080';
    detectPort(_port, (err, port) => {
      if (err) {
        console.log(err);
      }
      port.should.within(parseInt(_port, 10), 65535);
      done();
    });
  });

  it('callback with wrong arguments', done => {
    detectPort('oooo', err => {
      err.should.containEql('wrong type of arguments');
      done();
    });
  });

  it('generator usage', function *() {
    const _port = 8080;
    try {
      const port = yield detectPort(_port);
      port.should.within(_port, 65535);
    } catch (err) {
      console.log(err);
    }
  });

  it('promise usage', done => {
    const _port = 8080;
    detectPort(_port)
      .then(port => {
        port.should.within(_port, 65535);
        done();
      })
      .catch(err => {
        console.log(err);
        done();
      });
  });

  it('promise with wrong arguments', done => {
    detectPort()
      .then(() => {
        done();
      })
      .catch(err => {
        err.should.containEql('wrong number of arguments');
        done();
      });
  });

  it('generator with wrong arguments', function *() {
    try {
      yield detectPort('oooo');
    } catch (err) {
      err.should.containEql('wrong type of arguments');
    }
  });

});
