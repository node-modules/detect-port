import dns from 'node:dns';
import net from 'node:net';
import { strict as assert } from 'node:assert';
import { ip } from 'address';
import mm from 'mm';

import detectPort from '../src/detect-port.js';

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
      const server = new net.Server();
      server.listen(23000, 'localhost', cb);
      server.on('error', err => {
        console.error('listen localhost error:', err);
      });
      servers.push(server);

      const server2 = new net.Server();
      server2.listen(24000, ip(), cb);
      servers.push(server2);

      const server3 = new net.Server();
      server3.listen(28080, '0.0.0.0', cb);
      servers.push(server3);

      for (let port = 27000; port < 27010; port++) {
        const server = new net.Server();
        if (port % 3 === 0) {
          server.listen(port, cb);
        } else if (port % 3 === 1) {
          server.listen(port, 'localhost', cb);
        } else {
          server.listen(port, ip(), cb);
        }
        servers.push(server);
      }
    });

    after(() => {
      servers.forEach(server => server.close());
    });

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

    it('should listen next port 24001 when localhost is not binding', async () => {
      mm(dns, 'lookup', (...args: any[]) => {
        mm.restore();
        const address = args[0] as string;
        if (address !== 'localhost') {
          return dns.lookup(args[0], args[1], args[2]);
        }
        process.nextTick(() => {
          const err = new Error(`getaddrinfo ENOTFOUND ${address}`);
          (err as any).code = 'ENOTFOUND';
          const callback = args[-1];
          callback(err);
        });
      });

      const port = 24000;
      const realPort = await detectPort(port);
      assert.equal(realPort, 24001);
    });

    it('work with listening next port 24001 because 24000 was listened to ' + ip(), async () => {
      const port = 24000;
      const realPort = await detectPort(port);

      assert(realPort === 24001);
    });

    it('work with listening next port 28081 because 28080 was listened to 0.0.0.0:28080', async () => {
      const port = 28080;
      const realPort = await detectPort(port);

      assert(realPort === 28081);
    });

    it('work with listening random port when try port hit maxPort', async () => {
      const port = 27000;
      const realPort = await detectPort(port);
      assert(realPort < 27000 || realPort > 27009);
    });

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

    it('generator with wrong arguments and return random port', async () => {
      const port = await detectPort('oooo');
      assert(port > 0);
      assert(typeof port === 'number');
    });
  });
});
