import { describe, it, expect, afterAll } from 'vitest';
import { createServer, type Server } from 'node:net';
import { once } from 'node:events';
import { detectPort, waitPort, WaitPortRetryError } from '../src/index.js';

describe('test/integration.test.ts - Integration scenarios', () => {
  const servers: Server[] = [];

  afterAll(() => {
    servers.forEach(server => server.close());
  });

  describe('detectPort and waitPort integration', () => {
    it('should detect port and then wait for it to be occupied', async () => {
      // Step 1: Detect a free port
      const port = await detectPort();
      expect(port).toBeGreaterThan(0);

      // Step 2: Occupy the port after a delay
      setTimeout(async () => {
        const server = createServer();
        server.listen(port, '0.0.0.0');
        await once(server, 'listening');
        servers.push(server);
      }, 200);

      // Step 3: Wait for port to become occupied
      const result = await waitPort(port, { retries: 10, retryInterval: 100 });
      expect(result).toBe(true);

      // Step 4: Verify port is occupied by trying to detect it
      const nextPort = await detectPort(port);
      expect(nextPort).toBeGreaterThan(port);
    });

    it('should handle case where waitPort times out', async () => {
      const port = await detectPort();
      // Don't occupy port, so waitPort will timeout

      // Try to wait but will timeout
      try {
        await waitPort(port, { retries: 2, retryInterval: 50 });
        expect.fail('Should have timed out');
      } catch (err: any) {
        expect(err).toBeInstanceOf(WaitPortRetryError);
      }

      // Detect should return the same port since it's still free
      const samePort = await detectPort(port);
      expect(samePort).toBe(port);
    });
  });

  describe('Concurrent port detection', () => {
    it('should handle multiple concurrent detectPort calls', async () => {
      const promises = Array.from({ length: 5 }, () => detectPort());
      const ports = await Promise.all(promises);

      // All ports should be valid
      ports.forEach(port => {
        expect(port).toBeGreaterThan(0);
        expect(port).toBeLessThanOrEqual(65535);
      });

      // Ports might be the same or different, both are valid
      expect(ports).toHaveLength(5);
    });

    it('should handle concurrent detectPort with same starting port', async () => {
      const startPort = 18000;
      const promises = Array.from({ length: 3 }, () => detectPort(startPort));
      const ports = await Promise.all(promises);

      // All should find ports >= startPort
      ports.forEach(port => {
        expect(port).toBeGreaterThanOrEqual(startPort);
        expect(port).toBeLessThanOrEqual(65535);
      });
    });

    it('should handle concurrent waitPort calls on different ports', async () => {
      const port1 = await detectPort();
      const port2 = await detectPort(port1 + 10);

      // Occupy ports after a delay
      setTimeout(async () => {
        const server1 = createServer();
        const server2 = createServer();

        server1.listen(port1, '0.0.0.0');
        server2.listen(port2, '0.0.0.0');

        await once(server1, 'listening');
        await once(server2, 'listening');
        
        servers.push(server1, server2);
      }, 300);

      const promises = [
        waitPort(port1, { retries: 10, retryInterval: 100 }),
        waitPort(port2, { retries: 10, retryInterval: 100 }),
      ];

      const results = await Promise.all(promises);
      expect(results).toEqual([true, true]);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle rapid port occupation and release', async () => {
      const port = await detectPort();

      // Rapidly open and close servers
      for (let i = 0; i < 3; i++) {
        const server = createServer();
        server.listen(port, '0.0.0.0');
        await once(server, 'listening');
        server.close();
        await once(server, 'close');
      }

      // Port should be free after all operations
      const finalPort = await detectPort(port);
      expect(finalPort).toBe(port);
    });

    it('should handle server lifecycle with detectPort', async () => {
      // Simulate server startup
      let port = await detectPort(20000);
      const server = createServer();
      server.listen(port, '0.0.0.0');
      await once(server, 'listening');
      servers.push(server);

      // Simulate needing another port for another service
      const secondPort = await detectPort(20000);
      expect(secondPort).toBeGreaterThan(port);

      const server2 = createServer();
      server2.listen(secondPort, '0.0.0.0');
      await once(server2, 'listening');
      servers.push(server2);

      // Both servers should be running
      expect(server.listening).toBe(true);
      expect(server2.listening).toBe(true);
    });

    it('should handle detectPort with callback in production-like scenario', async () => {
      return new Promise<void>((resolve) => {
        detectPort(21000, (err, port) => {
          expect(err).toBeNull();
          expect(port).toBeGreaterThanOrEqual(21000);

          // Use the detected port to start a server
          const server = createServer();
          server.listen(port!, '0.0.0.0', () => {
            expect(server.listening).toBe(true);
            server.close();
            resolve();
          });
        });
      });
    });
  });

  describe('Error recovery scenarios', () => {
    it('should recover from port range exhaustion', async () => {
      // Try to detect port in a very high range
      const port = await detectPort(65530);
      expect(port).toBeGreaterThanOrEqual(0);
      expect(port).toBeLessThanOrEqual(65535);
      
      // Should be able to use the detected port
      const server = createServer();
      server.listen(port, '0.0.0.0');
      await once(server, 'listening');
      server.close();
    });

    it('should handle mix of successful and failed waitPort operations', async () => {
      const occupiedPort = await detectPort();

      const server = createServer();
      server.listen(occupiedPort, '0.0.0.0');
      await once(server, 'listening');
      servers.push(server);

      const freePort = await detectPort(occupiedPort + 10);

      const results = await Promise.allSettled([
        waitPort(occupiedPort, { retries: 1, retryInterval: 50 }), // Should succeed (already occupied)
        waitPort(freePort, { retries: 1, retryInterval: 50 }), // Should fail (free)
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      
      if (results[1].status === 'rejected') {
        expect(results[1].reason).toBeInstanceOf(WaitPortRetryError);
      }
    });
  });

  describe('Complex workflow scenarios', () => {
    it('should handle complete server deployment workflow', async () => {
      // 1. Find available port
      const desiredPort = 22000;
      let actualPort = await detectPort(desiredPort);
      
      // 2. Start server
      const server = createServer();
      server.listen(actualPort, '0.0.0.0');
      await once(server, 'listening');
      servers.push(server);
      
      // 3. Verify port is occupied
      const nextAvailable = await detectPort(actualPort);
      expect(nextAvailable).toBeGreaterThan(actualPort);
      
      // 4. Wait should succeed immediately since port is occupied
      await waitPort(actualPort, { retries: 2, retryInterval: 50 });
      
      // 5. Verify port is still occupied
      const stillOccupied = await detectPort(actualPort);
      expect(stillOccupied).toBeGreaterThan(actualPort);
    });

    it('should handle multiple service ports allocation', async () => {
      const services = ['api', 'database', 'cache', 'websocket'];
      const startPort = 23000;
      
      const ports: Record<string, number> = {};
      
      // Allocate ports for each service
      for (const service of services) {
        const offset = services.indexOf(service) * 10;
        ports[service] = await detectPort(startPort + offset);
        expect(ports[service]).toBeGreaterThanOrEqual(startPort + offset);
      }
      
      // Verify all ports are assigned
      expect(Object.keys(ports)).toHaveLength(services.length);
      
      // Start servers on allocated ports
      const serviceServers: Server[] = [];
      for (const service of services) {
        const server = createServer();
        server.listen(ports[service], '0.0.0.0');
        await once(server, 'listening');
        serviceServers.push(server);
      }
      
      // Verify all services are running
      expect(serviceServers.every(s => s.listening)).toBe(true);
      
      // Cleanup
      serviceServers.forEach(s => s.close());
    });
  });
});
