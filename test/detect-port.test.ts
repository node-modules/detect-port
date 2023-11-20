import dns from 'node:dns';
import net from 'node:net';
import { strict as assert } from 'node:assert';
import { mock, describe, it, before, after } from 'node:test';
import { ip } from 'address';

import detectPort from '../src/detect-port.js';

describe('test/detect-port.test.js', () => {
  describe('detect port test', () => {
    const servers: net.Server[] = [];
    before((_, done) => {
      let count = 0;
      const cb = mock.fn((err?: Error) => {
        if (err) {
          done(err);
        }
        count += 1;
        if (count === 13) {
          done();
        }
      });
      const server = new net.Server();
      server.listen(3000, 'localhost', cb);
      server.on('error', err => {
        console.error('listen localhost error:', err);
      });
      servers.push(server);

      const server2 = new net.Server();
      server2.listen(4000, ip(), cb);
      servers.push(server2);

      const server3 = new net.Server();
      server3.listen(8080, '0.0.0.0', cb);
      servers.push(server3);

      for (let port = 7000; port < 7010; port++) {
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
      mock.reset();
    });

    it('get random port with callback', (_, done) => {
      detectPort((_, port) => {
        assert(port >= 1024 && port < 65535);
        done();
      });

    });

    it('get random port with promise', async () => {
      const port = await detectPort();

      assert(port >= 1024 && port < 65535);
    });

    it('with occupied port', async () => {
      const port = 80;
      const realPort = await detectPort(port);

      assert(realPort >= port && realPort < 65535);
    });

    it('work with listening next port 3001 because 3000 was listened to localhost', async () => {
      const port = 3000;
      const realPort = await detectPort(port);

      assert(realPort === 3001);
    });

    it('should listen next port 4001 when localhost is not binding', async t => {
      t.mock.method(dns, 'lookup', (address: string, callback: (...args: any[]) => void) => {
        if (address !== 'localhost') {
          return dns.lookup(address, callback);
        }
        process.nextTick(() => {
          const err = new Error(`getaddrinfo ENOTFOUND ${address}`);
          (err as any).code = 'ENOTFOUND';
          callback(err);
        });
      }, { times: 1 });

      const port = 4000;
      const realPort = await detectPort(port);

      assert(realPort === 4001);

      t.mock.reset();
    });

    it('work with listening next port 4001 because 4000 was listened to ' + ip(), async () => {
      const port = 4000;
      const realPort = await detectPort(port);

      assert(realPort === 4001);
    });

    it('work with listening next port 8081 because 8080 was listened to 0.0.0.0:8080', async () => {
      const port = 8080;
      const realPort = await detectPort(port);

      assert(realPort === 8081);
    });

    it('work with listening random port when try port hit maxPort', async () => {
      const port = 7000;
      const realPort = await detectPort(port);
      assert(realPort < 7000 || realPort > 7009);
    });

    it('work with sending object with hostname', (_, done) => {
      const port = 7000;
      const hostname = '127.0.0.1';
      detectPort({
        port,
        hostname,
        callback: (_, realPort) => {
          assert(realPort >= 7000 && realPort < 65535);
          done();
        },
      });
    });

    it('promise with sending object with hostname', async () => {
      const port = 7000;
      const hostname = '127.0.0.1';
      const realPort = await detectPort({
        port,
        hostname,
      });
      assert(realPort >= 7000 && realPort < 65535);
    });

    it('with string arg', async () => {
      const port = '8080';
      const realPort = await detectPort(port);
      assert(realPort >= 8080 && realPort < 65535);
    });

    it('with wrong arguments', async () => {
      const port = await detectPort('oooo');
      assert(port && port > 0);
    });

    it('generator usage', async () => {
      const port = 8080;
      const realPort = await detectPort(port);
      assert(realPort >= port && realPort < 65535);
    });

    it('promise usage', (_, done) => {
      const _port = 8080;
      detectPort(_port)
        .then(port => {
          assert(port >= _port && port < 65535);
          done();
        })
        .catch(done);
    });

    it('promise with wrong arguments', (_, done) => {
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
