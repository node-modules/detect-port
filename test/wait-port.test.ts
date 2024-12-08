import { once } from 'node:events';
import { createServer, Server } from 'node:net';
import { strict as assert } from 'node:assert';
import { waitPort, detectPort } from '../src/index.js';

describe('test/wait-port.test.ts', () => {
  describe('wait for port', () => {
    const servers: Server[] = [];
    after(() => {
      servers.forEach(server => server.close());
    });

    it('should be work', async () => {
      const port = await detectPort();
      const server = createServer();
      servers.push(server);
      server.listen(port, '0.0.0.0');
      await once(server, 'listening');
      setTimeout(() => {
        server.close();
      }, 2000);
      await waitPort(port);
    });

    it('should be work when retries exceeded', async () => {
      try {
        const port = 9093;
        await waitPort(port, { retries: 3, retryInterval: 100 });
      } catch (err:any) {
        assert.equal(err.message, 'retries exceeded');
      }
    });
  });
});
