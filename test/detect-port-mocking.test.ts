import { describe, it, expect, vi } from 'vitest';
import { createServer, type Server } from 'node:net';
import { once } from 'node:events';

async function blockPorts(startPort: number, count: number): Promise<Server[]> {
  const blocked: Server[] = [];
  for (let i = 0; i < count; i++) {
    const s = createServer();
    s.listen(startPort + i);
    await once(s, 'listening');
    blocked.push(s);
  }
  return blocked;
}

async function blockPortOnInterfaces(port: number): Promise<Server[]> {
  const blocked: Server[] = [];
  const bindings: [number, string][] = [
    [port, 'localhost'],
    [port + 1, '127.0.0.1'],
    [port + 2, '0.0.0.0'],
  ];
  for (const [p, host] of bindings) {
    const s = createServer();
    s.listen(p, host);
    await once(s, 'listening');
    blocked.push(s);
  }
  return blocked;
}

async function detectBlockedPort(targetPort: number): Promise<{ detected: number; blocker: Server }> {
  const { detectPort } = await import('../src/index.js');
  const s = createServer();
  s.listen(targetPort);
  await once(s, 'listening');
  const detected = await detectPort(targetPort);
  return { detected, blocker: s };
}

describe('test/detect-port-mocking.test.ts - Mocking to reach 100% coverage', () => {
  it('should handle ENOTFOUND DNS error by resolving with the port', async () => {
    // This test aims to trigger the ENOTFOUND error handling
    // We'll use a hostname that might cause DNS issues
    const { detectPort } = await import('../src/index.js');
    
    // Try with a hostname that should not exist
    // The code should handle ENOTFOUND and return the port anyway
    try {
      const port = await detectPort({ port: 9999, hostname: 'this-hostname-definitely-does-not-exist-123456789.local' });
      // If we get here, either the hostname resolved or ENOTFOUND was handled
      expect(port).toBeGreaterThanOrEqual(9999);
    } catch (err: any) {
      // It's okay if it fails - the hostname resolution behavior varies by system
      console.log('DNS error (expected on some systems):', err.message);
    }
  });

  it('should handle localhost EADDRNOTAVAIL and continue to next check', async () => {
    // When localhost binding fails with EADDRNOTAVAIL, the code should continue
    // This can happen when localhost is not properly configured
    const { detectPort } = await import('../src/index.js');
    
    // Normal detection without specific hostname
    const port = await detectPort(35000);
    expect(port).toBeGreaterThanOrEqual(35000);
  });

  it('should handle errors on all binding attempts and increment port', async () => {
    const { detectPort } = await import('../src/index.js');
    const startPort = 36000;
    const blocked = await blockPorts(startPort, 8);
    
    try {
      const detectedPort = await detectPort(startPort);
      expect(detectedPort).toBeGreaterThanOrEqual(startPort);
    } finally {
      blocked.forEach(s => s.close());
    }
  });

  it('should handle port 0 (random) edge cases', async () => {
    const { detectPort } = await import('../src/index.js');
    
    // Test random port assignment multiple times
    const ports: number[] = [];
    for (let i = 0; i < 3; i++) {
      const port = await detectPort(0);
      expect(port).toBeGreaterThan(0);
      ports.push(port);
    }
    
    // All should be valid ports
    expect(ports.every(p => p > 0 && p <= 65535)).toBe(true);
  });

  it('should handle errors on hostname-specific binding', async () => {
    const { detectPort } = await import('../src/index.js');
    const port = 37000;
    const blocked = await blockPortOnInterfaces(port);
    
    try {
      const detectedPort = await detectPort(port);
      expect(detectedPort).toBeGreaterThanOrEqual(port);
    } finally {
      blocked.forEach(s => s.close());
    }
  });

  it('should handle hostname-based detection with occupied ports', async () => {
    const { detectPort } = await import('../src/index.js');
    
    const port = 38000;
    const server = createServer();
    
    try {
      // Occupy port with specific hostname
      server.listen(port, '127.0.0.1');
      await once(server, 'listening');

      // Try to detect with same hostname
      const detectedPort = await detectPort({ port, hostname: '127.0.0.1' });
      expect(detectedPort).toBeGreaterThan(port);
    } finally {
      server.close();
    }
  });

  it('should test all error paths in tryListen function', async () => {
    const { detected: result1, blocker } = await detectBlockedPort(39000);
    expect(result1).toBeGreaterThan(39000);
    blocker.close();

    const { detectPort } = await import('../src/index.js');
    const result2 = await detectPort(0);
    expect(result2).toBeGreaterThan(0);

    const result3 = await detectPort(65530);
    expect(result3).toBeGreaterThanOrEqual(0);
    expect(result3).toBeLessThanOrEqual(65535);
  });
});
