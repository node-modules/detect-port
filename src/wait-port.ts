import { debuglog } from 'node:util';
import { detectPort } from './detect-port.js';

const debug = debuglog('detect-port:wait-port');

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export class WaitPortRetryError extends Error {
  retries: number;
  count: number;

  constructor(message: string, retries: number, count: number, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    this.retries = retries;
    this.count = count;
    Error.captureStackTrace(this, this.constructor);
  }
}

export interface WaitPortOptions {
  retryInterval?: number;
  retries?: number;
}

export async function waitPort(port: number, options: WaitPortOptions = {}) {
  const { retryInterval = 1000, retries = Infinity } = options;
  let count = 1;

  async function loop() {
    debug('wait port %d, retries %d, count %d', port, retries, count);
    if (count > retries) {
      const err = new WaitPortRetryError('retries exceeded', retries, count);
      throw err;
    }
    count++;
    const freePort = await detectPort(port);
    if (freePort === port) {
      await sleep(retryInterval);
      return loop();
    }
    return true;
  }

  return await loop();
}
