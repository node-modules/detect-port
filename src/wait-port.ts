import { debuglog } from 'node:util';
import detectPort from './detect-port.js';

const debug = debuglog('detect-port:wait-port');

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface WaitPortOptions {
  retryInterval?: number;
  retries?: number;
}

export default async function waitPort(port: number, options: WaitPortOptions = {}) {
  const { retryInterval = 1000, retries = Infinity } = options;
  let count = 1;

  async function loop() {
    debug('wait port %d, retries %d, count %d', port, retries, count);
    if (count > retries) {
      const err = new Error('retries exceeded');
      (err as any).retries = retries;
      (err as any).count = count;
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
