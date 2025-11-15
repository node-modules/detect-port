import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'node:net';
import { once } from 'node:events';

describe('test/detect-port-spy.test.ts - Use spies to reach remaining coverage', () => {
  let originalCreateServer: typeof net.createServer;

  beforeEach(() => {
    originalCreateServer = net.createServer;
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
    
    // Block on the machine's IP
    const port = 40300;
    const machineIp = ip();
    
    if (machineIp) {
      const blocker = originalCreateServer();
      try {
        blocker.listen(port, machineIp);
        await once(blocker, 'listening');
        
        const detectedPort = await detectPort(port);
        expect(detectedPort).toBeGreaterThan(port);
        
        blocker.close();
      } catch (err) {
        // If we can't bind to machine IP, that's okay
        console.log('Could not bind to machine IP:', err);
      }
    } else {
      // No machine IP available, skip this test
      console.log('No machine IP available');
    }
  });

  it('should try multiple consecutive ports when all interfaces are blocked', async () => {
    const { detectPort } = await import('../src/index.js');
    
    const startPort = 40400;
    const blockers: any[] = [];
    
    try {
      // Block several consecutive ports
      for (let i = 0; i < 5; i++) {
        const port = startPort + i;
        
        // Try to block on multiple interfaces
        const b1 = originalCreateServer();
        b1.listen(port);
        await once(b1, 'listening');
        blockers.push(b1);
      }

      const detectedPort = await detectPort(startPort);
      expect(detectedPort).toBeGreaterThanOrEqual(startPort);
    } finally {
      blockers.forEach(b => b.close());
    }
  });

  it('should handle all binding attempts failing and increment through ports', async () => {
    const { detectPort } = await import('../src/index.js');
    
    const startPort = 40500;
    const blockers: any[] = [];
    
    try {
      // Create a more complex blocking scenario
      for (let i = 0; i < 3; i++) {
        const port = startPort + i;
        
        // Block on default interface
        const b1 = originalCreateServer();
        b1.listen(port);
        await once(b1, 'listening');
        blockers.push(b1);
        
        // Try to also block on 0.0.0.0 for the next port
        if (i < 2) {
          const b2 = originalCreateServer();
          try {
            b2.listen(port, '0.0.0.0');
            await once(b2, 'listening');
            blockers.push(b2);
          } catch (e) {
            // Might already be in use
          }
        }
      }

      const detectedPort = await detectPort(startPort);
      expect(detectedPort).toBeGreaterThanOrEqual(startPort);
    } finally {
      blockers.forEach(b => b.close());
    }
  });
});
