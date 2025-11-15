import { describe, it, expect } from 'vitest';
import detectPortDefault, { detect, detectPort, waitPort, WaitPortRetryError, IPAddressNotAvailableError, type DetectPortCallback, type PortConfig, type WaitPortOptions } from '../src/index.js';

describe('test/index.test.ts - Main entry exports', () => {
  it('should export detectPort as default', () => {
    expect(detectPortDefault).toBeDefined();
    expect(typeof detectPortDefault).toBe('function');
  });

  it('should export detect alias', () => {
    expect(detect).toBeDefined();
    expect(typeof detect).toBe('function');
    expect(detect).toBe(detectPort);
  });

  it('should export detectPort', () => {
    expect(detectPort).toBeDefined();
    expect(typeof detectPort).toBe('function');
  });

  it('should export waitPort', () => {
    expect(waitPort).toBeDefined();
    expect(typeof waitPort).toBe('function');
  });

  it('should export WaitPortRetryError', () => {
    expect(WaitPortRetryError).toBeDefined();
    const err = new WaitPortRetryError('test', 5, 6);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('WaitPortRetryError');
    expect(err.message).toBe('test');
    expect(err.retries).toBe(5);
    expect(err.count).toBe(6);
  });

  it('should export IPAddressNotAvailableError', () => {
    expect(IPAddressNotAvailableError).toBeDefined();
    const err = new IPAddressNotAvailableError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('IPAddressNotAvailableError');
    expect(err.message).toBe('The IP address is not available on this machine');
  });

  it('should have proper type exports', () => {
    // Type check - these should compile
    const callback: DetectPortCallback = (err, port) => {
      expect(err || port).toBeDefined();
    };
    const config: PortConfig = { port: 3000, hostname: 'localhost' };
    const options: WaitPortOptions = { retries: 5, retryInterval: 1000 };
    
    expect(callback).toBeDefined();
    expect(config).toBeDefined();
    expect(options).toBeDefined();
  });
});
