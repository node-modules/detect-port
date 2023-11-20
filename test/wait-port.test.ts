import net from 'node:net';
import { describe, it, after } from 'node:test';
import { strict as assert } from 'node:assert';

import waitPort from '../src/wait-port.js';

describe('test/wait-port.test.js', () => {
  describe('wait for port', () => {
    const servers: net.Server[] = [];
    after(() => {
      servers.forEach(server => server.close());
    });

    it('should be work', (_, done) => {
      const port = 9090;
      const server = new net.Server();
      server.listen(port, '0.0.0.0');
      servers.push(server);
      setTimeout(() => {
        waitPort(port).then().finally(done);
      });
    });

    it('should be work when retries exceeded', async () => {
      try {
        const port = 9093;
        await waitPort(port, { retries: 3, retryInterval: 100 });
      } catch (err:any) {
        assert(err.message === 'retries exceeded');
      }
    });
  });
});
