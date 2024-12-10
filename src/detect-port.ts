import { createServer, AddressInfo } from 'node:net';
import { debuglog } from 'node:util';
import { ip } from 'address';

const debug = debuglog('detect-port');

export type DetectPortCallback = (err: Error | null, port?: number) => void;

export interface PortConfig {
  port?: number | string;
  hostname?: string | undefined;
  callback?: DetectPortCallback;
}

export class IPAddressNotAvailableError extends Error {
  constructor(options?: ErrorOptions) {
    super('The IP address is not available on this machine', options);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function detectPort(port?: number | PortConfig | string): Promise<number>;
export function detectPort(callback: DetectPortCallback): void;
export function detectPort(port: number | PortConfig | string | undefined, callback: DetectPortCallback): void;
export function detectPort(port?: number | string | PortConfig | DetectPortCallback, callback?: DetectPortCallback) {
  let hostname: string | undefined = '';

  if (port && typeof port === 'object') {
    hostname = port.hostname;
    callback = port.callback;
    port = port.port;
  } else {
    if (typeof port === 'function') {
      callback = port;
      port = void 0;
    }
  }

  port = parseInt(port as unknown as string) || 0;
  let maxPort = port + 10;
  if (maxPort > 65535) {
    maxPort = 65535;
  }
  debug('detect free port between [%s, %s)', port, maxPort);
  if (typeof callback === 'function') {
    return tryListen(port, maxPort, hostname)
      .then(port => callback(null, port))
      .catch(callback);
  }
  // promise
  return tryListen(port as number, maxPort, hostname);
}

async function handleError(port: number, maxPort: number, hostname?: string) {
  if (port >= maxPort) {
    debug('port: %s >= maxPort: %s, give up and use random port', port, maxPort);
    port = 0;
    maxPort = 0;
  }
  return await tryListen(port, maxPort, hostname);
}

async function tryListen(port: number, maxPort: number, hostname?: string): Promise<number> {
  // use user hostname
  if (hostname) {
    try {
      return await listen(port, hostname);
    } catch (err: any) {
      if (err.code === 'EADDRNOTAVAIL') {
        throw new IPAddressNotAvailableError({ cause: err });
      }
      return await handleError(++port, maxPort, hostname);
    }
  }

  // 1. check null / undefined
  try {
    await listen(port);
  } catch (err) {
    // ignore random listening
    if (port === 0) {
      throw err;
    }
    return await handleError(++port, maxPort, hostname);
  }

  // 2. check 0.0.0.0
  try {
    await listen(port, '0.0.0.0');
  } catch (err) {
    return await handleError(++port, maxPort, hostname);
  }

  // 3. check 127.0.0.1
  try {
    await listen(port, '127.0.0.1');
  } catch (err) {
    return await handleError(++port, maxPort, hostname);
  }

  // 4. check localhost
  try {
    await listen(port, 'localhost');
  } catch (err: any) {
    // if localhost refer to the ip that is not unknown on the machine, you will see the error EADDRNOTAVAIL
    // https://stackoverflow.com/questions/10809740/listen-eaddrnotavail-error-in-node-js
    if (err.code !== 'EADDRNOTAVAIL') {
      return await handleError(++port, maxPort, hostname);
    }
  }

  // 5. check current ip
  try {
    return await listen(port, ip());
  } catch (err) {
    return await handleError(++port, maxPort, hostname);
  }
}

function listen(port: number, hostname?: string) {
  const server = createServer();

  return new Promise<number>((resolve, reject) => {
    server.once('error', err => {
      debug('listen %s:%s error: %s', hostname, port, err);
      server.close();

      if ((err as any).code === 'ENOTFOUND') {
        debug('ignore dns ENOTFOUND error, get free %s:%s', hostname, port);
        return resolve(port);
      }

      return reject(err);
    });

    debug('try listen %d on %s', port, hostname);
    server.listen(port, hostname, () => {
      port = (server.address() as AddressInfo).port;
      debug('get free %s:%s', hostname, port);
      server.close();
      return resolve(port);
    });
  });
}
