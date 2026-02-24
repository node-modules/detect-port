import { describe, it, expect, beforeAll } from 'vitest';
import { createServer } from 'node:net';
import { once } from 'node:events';

// Import modules
let detectPort: any;

async function occupyPorts(startPort: number, count: number): Promise<any[]> {
  const occupied: any[] = [];
  for (let i = 0; i < count; i++) {
    const server = createServer();
    server.listen(startPort + i, '0.0.0.0');
    await once(server, 'listening');
    occupied.push(server);
  }
  return occupied;
}

function closeAllServers(list: any[]) {
  list.forEach(s => {
    try {
      s.close();
    } catch {
      // Ignore close errors
    }
  });
}

describe('test/detect-port-advanced.test.ts - Advanced edge cases for 100% coverage', () => {
  beforeAll(async () => {
    // Import modules
    const module = await import('../src/index.js');
    detectPort = module.detectPort;
  });

  describe('Cover remaining uncovered lines', () => {
    it('should handle multiple consecutive occupied ports and find available one', async () => {
      const startPort = 31000;
      const occupied = await occupyPorts(startPort, 3);

      try {
        const detectedPort = await detectPort(startPort);
        expect(detectedPort).toBeGreaterThanOrEqual(startPort);
        expect(detectedPort).toBeLessThanOrEqual(startPort + 10);
      } finally {
        closeAllServers(occupied);
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
      const occupied = await occupyPorts(port, 1);

      try {
        const detectedPort = await detectPort(port);
        expect(detectedPort).toBeGreaterThan(port);
        expect(detectedPort).toBeLessThanOrEqual(port + 10);
      } finally {
        closeAllServers(occupied);
      }
    });
  });
});
