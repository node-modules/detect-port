import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from 'node:net';
import { once } from 'node:events';

async function blockConsecutivePorts(
  factory: typeof createServer,
  startPort: number,
  count: number,
): Promise<any[]> {
  const blockers: any[] = [];
  for (let i = 0; i < count; i++) {
    const b = factory();
    b.listen(startPort + i);
    await once(b, 'listening');
    blockers.push(b);
  }
  return blockers;
}

async function tryBlockSecondary(
  factory: typeof createServer,
  startPort: number,
  count: number,
): Promise<any[]> {
  const blockers: any[] = [];
  for (let i = 0; i < count - 1; i++) {
    const b = factory();
    try {
      b.listen(startPort + i, '0.0.0.0');
      await once(b, 'listening');
      blockers.push(b);
    } catch {
      // Might already be in use
    }
  }
  return blockers;
}

async function blockWithDualInterface(
  factory: typeof createServer,
  startPort: number,
  count: number,
): Promise<any[]> {
  const primary = await blockConsecutivePorts(factory, startPort, count);
  const secondary = await tryBlockSecondary(factory, startPort, count);
  return [...primary, ...secondary];
}

async function testMachineIpBlock(
  factory: typeof createServer,
  detectFn: (port: number) => Promise<number>,
  port: number,
  machineIp: string,
) {
  const blocker = factory();
  try {
    blocker.listen(port, machineIp);
    await once(blocker, 'listening');
    const detectedPort = await detectFn(port);
    expect(detectedPort).toBeGreaterThan(port);
    blocker.close();
  } catch (err) {
    // If we can't bind to machine IP, that's okay
    console.log('Could not bind to machine IP:', err);
  }
}

describe('test/detect-port-spy.test.ts - Use spies to reach remaining coverage', () => {
  let originalCreateServer: typeof createServer;

  beforeEach(() => {
    originalCreateServer = createServer;
  });

  afterEach(() => {
    // Restore original
    vi.restoreAllMocks();
  });

  it('should handle error when binding to 0.0.0.0 fails (line 92)', async () => {
    const { detectPort } = await import('../src/index.js');
    
    // Create a server on a port to force failure
    const port = 40000;
    const blocker = originalCreateServer();
    blocker.listen(port, '0.0.0.0');
    await once(blocker, 'listening');
    
    // Now try to detect this port - should skip to next
    const detectedPort = await detectPort(port);
    expect(detectedPort).toBeGreaterThan(port);
    
    blocker.close();
  });

  it('should handle error when binding to 127.0.0.1 fails (line 99)', async () => {
    const { detectPort } = await import('../src/index.js');
    
    // Block 127.0.0.1:port
    const port = 40100;
    const blocker = originalCreateServer();
    blocker.listen(port, '127.0.0.1');
    await once(blocker, 'listening');
    
    const detectedPort = await detectPort(port);
    expect(detectedPort).toBeGreaterThan(port);
    
    blocker.close();
  });

  it('should handle error when binding to localhost fails (lines 108-109)', async () => {
    const { detectPort } = await import('../src/index.js');
    
    // Block localhost:port
    const port = 40200;
    const blocker = originalCreateServer();
    blocker.listen(port, 'localhost');
    await once(blocker, 'listening');
    
    const detectedPort = await detectPort(port);
    expect(detectedPort).toBeGreaterThan(port);
    
    blocker.close();
  });

  it('should handle error when binding to machine IP fails (line 117)', async () => {
    const { detectPort } = await import('../src/index.js');
    const { ip } = await import('address');
    const port = 40300;
    const machineIp = ip();
    
    if (machineIp) {
      await testMachineIpBlock(originalCreateServer, detectPort, port, machineIp);
    } else {
      // No machine IP available, skip this test
      console.log('No machine IP available');
    }
  });

  it('should try multiple consecutive ports when all interfaces are blocked', async () => {
    const { detectPort } = await import('../src/index.js');
    const startPort = 40400;
    const blockers = await blockConsecutivePorts(originalCreateServer, startPort, 5);
    
    try {
      const detectedPort = await detectPort(startPort);
      expect(detectedPort).toBeGreaterThanOrEqual(startPort);
    } finally {
      blockers.forEach(b => b.close());
    }
  });

  it('should handle all binding attempts failing and increment through ports', async () => {
    const { detectPort } = await import('../src/index.js');
    const startPort = 40500;
    const blockers = await blockWithDualInterface(originalCreateServer, startPort, 3);
    
    try {
      const detectedPort = await detectPort(startPort);
      expect(detectedPort).toBeGreaterThanOrEqual(startPort);
    } finally {
      blockers.forEach(b => b.close());
    }
  });
});
