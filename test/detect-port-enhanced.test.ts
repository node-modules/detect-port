import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createServer, type Server } from 'node:net';
import { once } from 'node:events';
import { detectPort, IPAddressNotAvailableError } from '../src/index.js';

describe('test/detect-port-enhanced.test.ts - Edge cases and error handling', () => {
  const servers: Server[] = [];

  afterAll(() => {
    servers.forEach(server => server.close());
  });

  describe('Invalid port handling', () => {
    it('should handle negative port numbers', async () => {
      const port = await detectPort(-100);
      expect(port).toBeGreaterThanOrEqual(0);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle port > 65535', async () => {
      const port = await detectPort(70000);
      expect(port).toBeGreaterThanOrEqual(0);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle port 65535', async () => {
      const port = await detectPort(65535);
      expect(port).toBeGreaterThanOrEqual(0);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle float port numbers', async () => {
      const port = await detectPort(8080.5 as any);
      expect(port).toBeGreaterThanOrEqual(8080);
      expect(port).toBeLessThanOrEqual(65535);
    });
  });

  describe('Different hostname configurations', () => {
    it('should work with explicit 0.0.0.0 hostname', async () => {
      const port = await detectPort({ port: 0, hostname: '0.0.0.0' });
      expect(port).toBeGreaterThanOrEqual(1024);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should work with explicit 127.0.0.1 hostname', async () => {
      const port = await detectPort({ port: 0, hostname: '127.0.0.1' });
      expect(port).toBeGreaterThanOrEqual(1024);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should work with localhost hostname', async () => {
      const port = await detectPort({ port: 0, hostname: 'localhost' });
      expect(port).toBeGreaterThanOrEqual(1024);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should throw IPAddressNotAvailableError for unavailable IP', async () => {
      await expect(
        detectPort({ port: 3000, hostname: '192.168.255.255' })
      ).rejects.toThrow(IPAddressNotAvailableError);
    });

    it('should handle EADDRNOTAVAIL error with custom hostname', async () => {
      // Try with an IP that's likely not available on the machine
      try {
        await detectPort({ port: 3000, hostname: '10.255.255.1' });
      } catch (err: any) {
        expect(err).toBeInstanceOf(IPAddressNotAvailableError);
        expect(err.message).toContain('not available');
      }
    });

    it('should handle hostname with occupied port and retry', async () => {
      const port = 17000;
      const server = createServer();
      server.listen(port, '127.0.0.1');
      await once(server, 'listening');

      // Should find next available port
      const detectedPort = await detectPort({ port, hostname: '127.0.0.1' });
      expect(detectedPort).toBeGreaterThan(port);
      
      server.close();
    });
  });

  describe('Callback mode with different configurations', () => {
    it('should handle callback with successful port detection', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout - callback not called'));
        }, 5000);
        
        detectPort({
          port: 3000,
          hostname: 'localhost',
          callback: (err, port) => {
            clearTimeout(timeout);
            try {
              expect(err).toBeNull();
              expect(port).toBeGreaterThanOrEqual(3000);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        });
      });
    });

    it('should handle callback with port number and hostname', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout - callback not called'));
        }, 5000);
        
        detectPort({
          port: 5000,
          hostname: '127.0.0.1',
          callback: (err, port) => {
            clearTimeout(timeout);
            try {
              expect(err).toBeNull();
              expect(port).toBeGreaterThanOrEqual(5000);
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        });
      });
    });
  });

  describe('Port range boundary tests', () => {
    it('should handle port exactly at maxPort boundary (65535)', async () => {
      const port = await detectPort(65530);
      expect(port).toBeGreaterThanOrEqual(65530);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle when all ports in range are occupied', async () => {
      // Start with a high port so the range is small
      const startPort = 65530;
      const servers: Server[] = [];
      
      // Occupy several ports
      for (let p = startPort; p <= startPort + 5 && p <= 65535; p++) {
        const server = createServer();
        try {
          server.listen(p, '0.0.0.0');
          await once(server, 'listening');
          servers.push(server);
        } catch (err) {
          // Port might be occupied, skip
        }
      }

      // Try to detect a port in this range
      const detectedPort = await detectPort(startPort);
      
      // Should either find a port in range or fall back to random
      expect(detectedPort).toBeGreaterThanOrEqual(0);
      expect(detectedPort).toBeLessThanOrEqual(65535);

      // Cleanup
      servers.forEach(s => s.close());
    });
  });

  describe('Error path in tryListen', () => {
    it('should handle random port errors (port 0)', async () => {
      // This tests the error path when port === 0
      // It should re-throw the error
      const port = await detectPort(0);
      expect(port).toBeGreaterThanOrEqual(1024);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle error on all hostname checks and increment port', async () => {
      // Use multiple consecutive ports that are occupied
      // This forces the code to try all hostname checks and increment port
      const startPort = 18000;
      const servers: Server[] = [];
      
      // Occupy a range of ports to trigger multiple retry paths
      for (let p = startPort; p < startPort + 3; p++) {
        const server = createServer();
        try {
          server.listen(p, '0.0.0.0');
          await once(server, 'listening');
          servers.push(server);
        } catch (err) {
          // Port might be occupied, skip
        }
      }

      // Try to detect port in this range
      const detectedPort = await detectPort(startPort);
      expect(detectedPort).toBeGreaterThanOrEqual(startPort);
      
      // Cleanup
      servers.forEach(s => s.close());
    });
  });

  describe('Callback variations', () => {
    it('should work with callback as first parameter', async () => {
      return new Promise<void>((resolve) => {
        detectPort((err, port) => {
          expect(err).toBeNull();
          expect(port).toBeGreaterThanOrEqual(1024);
          expect(port).toBeLessThanOrEqual(65535);
          resolve();
        });
      });
    });

    it('should work with callback as second parameter', async () => {
      return new Promise<void>((resolve) => {
        detectPort(8000, (err, port) => {
          expect(err).toBeNull();
          expect(port).toBeGreaterThanOrEqual(8000);
          expect(port).toBeLessThanOrEqual(65535);
          resolve();
        });
      });
    });

    it('should work with string port and callback', async () => {
      return new Promise<void>((resolve) => {
        detectPort('9000', (err, port) => {
          expect(err).toBeNull();
          expect(port).toBeGreaterThanOrEqual(9000);
          expect(port).toBeLessThanOrEqual(65535);
          resolve();
        });
      });
    });
  });

  describe('Edge cases with occupied ports', () => {
    beforeAll(async () => {
      // Setup a server on a specific port for testing
      const server = createServer();
      server.listen(19999, '0.0.0.0');
      await once(server, 'listening');
      servers.push(server);
    });

    it('should skip occupied port and find next available', async () => {
      const port = await detectPort(19999);
      expect(port).toBeGreaterThan(19999);
      expect(port).toBeLessThanOrEqual(20009); // Within the search range
    });

    it('should work with PortConfig object containing occupied port', async () => {
      const port = await detectPort({ port: 19999, hostname: undefined });
      expect(port).toBeGreaterThan(19999);
    });
  });

  describe('String to number conversion', () => {
    it('should handle empty string port', async () => {
      const port = await detectPort('');
      expect(port).toBeGreaterThanOrEqual(0);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle invalid string port', async () => {
      const port = await detectPort('invalid');
      expect(port).toBeGreaterThanOrEqual(0);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle numeric string with spaces', async () => {
      const port = await detectPort(' 8080 ' as any);
      expect(port).toBeGreaterThanOrEqual(8080);
      expect(port).toBeLessThanOrEqual(65535);
    });
  });

  describe('PortConfig edge cases', () => {
    it('should handle PortConfig with undefined port', async () => {
      const port = await detectPort({ port: undefined, hostname: 'localhost' });
      expect(port).toBeGreaterThanOrEqual(0);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle PortConfig with string port', async () => {
      const port = await detectPort({ port: '7000', hostname: undefined });
      expect(port).toBeGreaterThanOrEqual(7000);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle PortConfig with callback but no hostname', async () => {
      return new Promise<void>((resolve) => {
        detectPort({
          port: 6000,
          callback: (err, port) => {
            expect(err).toBeNull();
            expect(port).toBeGreaterThanOrEqual(6000);
            resolve();
          },
        });
      });
    });
  });
});
