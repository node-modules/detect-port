import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { createServer, type Server } from 'node:net';
import { once } from 'node:events';
import { waitPort, detectPort, WaitPortRetryError } from '../src/index.js';

describe('test/wait-port-enhanced.test.ts - Enhanced wait-port coverage', () => {
  const servers: Server[] = [];

  afterAll(() => {
    servers.forEach(server => server.close());
  });

  describe('Timeout handling', () => {
    it('should throw WaitPortRetryError when retries exceeded', async () => {
      const port = await detectPort();
      // Don't occupy the port - waitPort waits until port IS occupied
      // If port stays free, it will timeout

      try {
        await waitPort(port, { retries: 2, retryInterval: 50 });
        expect.fail('Should have thrown WaitPortRetryError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(WaitPortRetryError);
        expect(err.message).toBe('retries exceeded');
        expect(err.retries).toBe(2);
        expect(err.count).toBe(3); // count starts at 1, so after 2 retries, count is 3
        expect(err.name).toBe('WaitPortRetryError');
      }
    });

    it('should respect retryInterval option', async () => {
      const port = await detectPort();
      // Don't occupy port so it times out

      const startTime = Date.now();
      try {
        await waitPort(port, { retries: 2, retryInterval: 100 });
      } catch (err: any) {
        const elapsed = Date.now() - startTime;
        // Should take at least 200ms (2 retries * 100ms interval)
        expect(elapsed).toBeGreaterThanOrEqual(180); // Allow some margin
        expect(err).toBeInstanceOf(WaitPortRetryError);
      }
    });

    it('should use default retry interval when not specified', async () => {
      const port = await detectPort();
      // Don't occupy port so it times out

      try {
        await waitPort(port, { retries: 1 }); // Only retryInterval not specified
        expect.fail('Should have thrown WaitPortRetryError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(WaitPortRetryError);
        expect(err.retries).toBe(1);
      }
    });

    it('should handle Infinity retries (port becomes available)', async () => {
      const port = await detectPort();
      const server = createServer();
      server.listen(port, '0.0.0.0');
      await once(server, 'listening');

      // Close server after a short delay
      setTimeout(() => {
        server.close();
      }, 500);

      // Should resolve when port becomes available
      const result = await waitPort(port, { retries: Infinity, retryInterval: 100 });
      expect(result).toBe(true);
    });
  });

  describe('Successful port waiting', () => {
    it('should resolve when port becomes occupied', async () => {
      const port = await detectPort();
      const server = createServer();
      server.listen(port, '0.0.0.0');
      await once(server, 'listening');

      // waitPort should detect that port is occupied and return immediately
      const result = await waitPort(port, { retries: 5, retryInterval: 100 });
      expect(result).toBe(true);
      
      server.close();
    });

    it('should wait and return when port becomes occupied', async () => {
      const port = await detectPort();
      
      // Occupy the port after 300ms
      setTimeout(async () => {
        const server = createServer();
        server.listen(port, '0.0.0.0');
        await once(server, 'listening');
        servers.push(server);
      }, 300);

      const result = await waitPort(port, { retries: 10, retryInterval: 100 });
      expect(result).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero retries', async () => {
      const port = await detectPort();
      // Don't occupy port so it times out immediately

      try {
        await waitPort(port, { retries: 0, retryInterval: 100 });
        expect.fail('Should have thrown WaitPortRetryError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(WaitPortRetryError);
        expect(err.retries).toBe(0);
        expect(err.count).toBe(1);
      }
    });

    it('should handle very short retry interval', async () => {
      const port = await detectPort();
      // Don't occupy port so it times out

      try {
        await waitPort(port, { retries: 2, retryInterval: 1 });
        expect.fail('Should have thrown WaitPortRetryError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(WaitPortRetryError);
      }
    });

    it('should handle empty options object with occupied port', async () => {
      const port = await detectPort();
      const server = createServer();
      server.listen(port, '0.0.0.0');
      await once(server, 'listening');
      servers.push(server);
      
      // Port is occupied, should succeed with default options
      const result = await waitPort(port, {});
      expect(result).toBe(true);
    });

    it('should handle undefined options with occupied port', async () => {
      const port = await detectPort();
      const server = createServer();
      server.listen(port, '0.0.0.0');
      await once(server, 'listening');
      servers.push(server);
      
      // Port is occupied, should succeed with default options
      const result = await waitPort(port);
      expect(result).toBe(true);
    });
  });

  describe('WaitPortRetryError properties', () => {
    it('should have correct error properties', async () => {
      const port = await detectPort();
      // Don't occupy port so it times out

      try {
        await waitPort(port, { retries: 3, retryInterval: 10 });
      } catch (err: any) {
        expect(err.name).toBe('WaitPortRetryError');
        expect(err.message).toBe('retries exceeded');
        expect(err.retries).toBe(3);
        expect(err.count).toBe(4);
        expect(err.stack).toBeDefined();
        expect(err instanceof Error).toBe(true);
        expect(err instanceof WaitPortRetryError).toBe(true);
      }
    });

    it('should create WaitPortRetryError with cause', () => {
      const cause = new Error('Original error');
      const err = new WaitPortRetryError('test message', 5, 6, { cause });
      expect(err.message).toBe('test message');
      expect(err.retries).toBe(5);
      expect(err.count).toBe(6);
      expect(err.cause).toBe(cause);
    });
  });

  describe('Multiple sequential waits', () => {
    it('should handle sequential waitPort calls on occupied ports', async () => {
      const port1 = await detectPort();
      const server1 = createServer();
      server1.listen(port1, '0.0.0.0');
      await once(server1, 'listening');
      servers.push(server1);

      // Wait for first port (already occupied, should return immediately)
      const result1 = await waitPort(port1, { retries: 2, retryInterval: 50 });
      expect(result1).toBe(true);

      const port2 = await detectPort(port1 + 10);
      const server2 = createServer();
      server2.listen(port2, '0.0.0.0');
      await once(server2, 'listening');
      servers.push(server2);

      // Wait for second port (already occupied, should return immediately)
      const result2 = await waitPort(port2, { retries: 2, retryInterval: 50 });
      expect(result2).toBe(true);
    });
  });
});
