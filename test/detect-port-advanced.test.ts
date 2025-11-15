import { describe, it, expect, beforeAll } from 'vitest';
import { createServer } from 'node:net';
import { once } from 'node:events';

// Import modules
let detectPort: any;

describe('test/detect-port-advanced.test.ts - Advanced edge cases for 100% coverage', () => {
  beforeAll(async () => {
    // Import modules
    const module = await import('../src/index.js');
    detectPort = module.detectPort;
  });

  describe('Cover remaining uncovered lines', () => {
    it('should handle multiple consecutive occupied ports and find available one', async () => {
      // Occupy several consecutive ports to force code through multiple checks
      const startPort = 31000;
      const servers: any[] = [];

      try {
        // Occupy 3 consecutive ports
        for (let i = 0; i < 3; i++) {
          const server = createServer();
          server.listen(startPort + i, '0.0.0.0');
          await once(server, 'listening');
          servers.push(server);
        }

        // Should find a port after the occupied ones
        const detectedPort = await detectPort(startPort);
        expect(detectedPort).toBeGreaterThanOrEqual(startPort);
        expect(detectedPort).toBeLessThanOrEqual(startPort + 10);
      } finally {
        // Cleanup
        servers.forEach(s => {
          try { s.close(); } catch (e) { /* ignore */ }
        });
      }
    });

    it('should handle scenario where localhost binding fails on occupied port', async () => {
      const port = 32000;
      const server = createServer();
      
      try {
        server.listen(port, 'localhost');
        await once(server, 'listening');

        // Try to detect the same port - should find next available
        const detectedPort = await detectPort(port);
        expect(detectedPort).toBeGreaterThan(port);
      } finally {
        server.close();
      }
    });

    it('should handle scenario where 127.0.0.1 binding fails on occupied port', async () => {
      const port = 33000;
      const server = createServer();
      
      try {
        server.listen(port, '127.0.0.1');
        await once(server, 'listening');

        // Try to detect the same port - should find next available
        const detectedPort = await detectPort(port);
        expect(detectedPort).toBeGreaterThan(port);
      } finally {
        server.close();
      }
    });

    it('should work with port 0 (random port selection)', async () => {
      // Port 0 means "give me any available port"
      const port = await detectPort(0);
      expect(port).toBeGreaterThanOrEqual(1024);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle occupied ports on different interfaces', async () => {
      const port = 34000;
      const servers: any[] = [];

      try {
        // Bind on 0.0.0.0
        const s1 = createServer();
        s1.listen(port, '0.0.0.0');
        await once(s1, 'listening');
        servers.push(s1);

        // Try to detect - should skip occupied port
        const detectedPort = await detectPort(port);
        expect(detectedPort).toBeGreaterThan(port);
        expect(detectedPort).toBeLessThanOrEqual(port + 10);
      } finally {
        servers.forEach(s => {
          try { s.close(); } catch (e) { /* ignore */ }
        });
      }
    });
  });
});
