import dns from 'node:dns';
import net from 'node:net';
import { strict as assert } from 'node:assert';
import { ip } from 'address';
import mm from 'mm';
import detect, { detect as detect2, detectPort } from '../src/index.js';

function setupNamedServers(servers: net.Server[], cb: (err?: Error) => void) {
  const configs = [
    { port: 23000, host: 'localhost', logErrors: true },
    { port: 24000, host: ip(), logErrors: false },
    { port: 28080, host: '0.0.0.0', logErrors: false },
    { port: 25000, host: '127.0.0.1', logErrors: true },
    { port: 25500, host: '::1', logErrors: true },
  ];
  for (const config of configs) {
    const s = new net.Server();
    s.listen(config.port, config.host, cb);
    if (config.logErrors) {
      s.on('error', err => {
        console.error(`listen ${config.host} error:`, err);
      });
    }
    servers.push(s);
  }
}

function setupRangeServers(servers: net.Server[], cb: (err?: Error) => void) {
  for (let port = 27000; port < 27010; port++) {
    const loopServer = new net.Server();
    if (port % 3 === 0) {
      loopServer.listen(port, cb);
    } else if (port % 3 === 1) {
      loopServer.listen(port, 'localhost', cb);
    } else {
      loopServer.listen(port, ip(), cb);
    }
    servers.push(loopServer);
  }
}

describe('test/detect-port.test.ts', () => {
  afterEach(mm.restore);

  describe('detect port test', () => {
    const servers: net.Server[] = [];
    before(done => {
      let count = 0;
      const cb = (err?: Error) => {
        if (err) {
          done(err);
        }
        count += 1;
        if (count === 13) {
          done();
        }
      };
      setupNamedServers(servers, cb);
      setupRangeServers(servers, cb);
    });

    after(() => {
      servers.forEach(s => s.close());
    });

    describe('basic port detection', () => {
      it('get random port with callback', done => {
        detectPort((_, port) => {
          assert(port);
          assert(port >= 1024 && port < 65535);
          done();
        });
      });

      it('get random port with promise', async () => {
        const port = await detectPort();

        assert(port >= 1024 && port < 65535);
      });

      it('should detect work', async () => {
        let port = await detect();
        assert(port >= 1024 && port < 65535);
        port = await detect2();
        assert(port >= 1024 && port < 65535);
      });

      it('with occupied port, like "listen EACCES: permission denied"', async () => {
        const port = 80;
        const realPort = await detectPort(port);
        assert(realPort >= port && realPort < 65535);
      });

      it('work with listening next port 23001 because 23000 was listened to localhost', async () => {
        const port = 23000;
        const realPort = await detectPort(port);
        assert(realPort);
        assert.equal(realPort, 23001);
      });

      it('work with listening next port 25001 because 25000 was listened to 127.0.0.1', async () => {
        const port = 25000;
        const realPort = await detectPort(port);
        assert(realPort);
        assert.equal(realPort, 25001);
      });
    });

    describe('port listening scenarios', () => {
      it('work with listening next port 25501 because 25500 was listened to ::1', async () => {
        const port = 25500;
        const realPort = await detectPort(port);
        assert(realPort);
        assert.equal(realPort, 25501);
      });

      it('should listen next port 24001 when localhost is not binding', async () => {
        mm(dns, 'lookup', (...args: any[]) => {
          mm.restore();
          const address = args[0] as string;
          if (address !== 'localhost') {
            return dns.lookup(args[0], args[1], args[2]);
          }
          const emitError = () => {
            const err = new Error(`getaddrinfo ENOTFOUND ${address}`);
            (err as any).code = 'ENOTFOUND';
            const callback = args[-1];
            callback(err);
          };
          process.nextTick(emitError);
        });

        const port = 24000;
        const realPort = await detectPort(port);
        assert.equal(realPort, 24001);
      });

      it('work with listening next port 24001 because 24000 was listened', async () => {
        const port = 24000;
        const realPort = await detectPort(port);
        assert.equal(realPort, 24001);
      });

      it('work with listening next port 28081 because 28080 was listened to 0.0.0.0:28080', async () => {
        const port = 28080;
        const realPort = await detectPort(port);

        assert.equal(realPort, 28081);
      });

      it('work with listening random port when try port hit maxPort', async () => {
        const port = 27000;
        const realPort = await detectPort(port);
        assert(realPort < 27000 || realPort > 27009);
      });
    });

    describe('API variations', () => {
      it('work with sending object with hostname', done => {
        const port = 27000;
        const hostname = '127.0.0.1';
        detectPort({
          port,
          hostname,
          callback: (_, realPort) => {
            assert(realPort);
            assert(realPort >= 27000 && realPort < 65535);
            done();
          },
        });
      });

      it('promise with sending object with hostname', async () => {
        const port = 27000;
        const hostname = '127.0.0.1';
        const realPort = await detectPort({
          port,
          hostname,
        });
        assert(realPort >= 27000 && realPort < 65535);
      });

      it('with string arg', async () => {
        const port = '28080';
        const realPort = await detectPort(port);
        assert(realPort >= 28080 && realPort < 65535);
      });

      it('with wrong arguments', async () => {
        const port = await detectPort('oooo');
        assert(port && port > 0);
      });

      it('async/await usage', async () => {
        const port = 28080;
        const realPort = await detectPort(port);
        assert(realPort >= port && realPort < 65535);
      });

      it('promise usage', done => {
        const _port = 28080;
        detectPort(_port)
          .then(port => {
            assert(port >= _port && port < 65535);
            return done();
          })
          .catch(done);
      });

      it('promise with wrong arguments', done => {
        detectPort()
          .then(port => {
            assert(port > 0);
            return done();
          })
          .catch(done);
      });

      it('generator with wrong arguments and return random port', async () => {
        const port = await detectPort('oooo');
        assert(port > 0);
        assert(typeof port === 'number');
      });
    });
  });
});
