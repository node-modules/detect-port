import { createServer, type AddressInfo } from 'node:net';
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
      const assignedPort = (server.address() as AddressInfo).port;
      debug('get free %s:%s', hostname, assignedPort);
      server.close();
      return resolve(assignedPort);
    });
  });
}

function getNextPort(port: number, maxPort: number) {
  if (port >= maxPort) {
    debug('port: %s >= maxPort: %s, give up and use random port', port, maxPort);
    return { port: 0, maxPort: 0 };
  }
  return { port, maxPort };
}

async function tryListenByHostname(port: number, maxPort: number, hostname: string): Promise<number> {
  let currentPort = port;
  let currentMaxPort = maxPort;
  for (;;) {
    try {
      return await listen(currentPort, hostname);
    } catch (err: any) {
      if (err.code === 'EADDRNOTAVAIL') {
        throw new IPAddressNotAvailableError({ cause: err });
      }
      const next = getNextPort(currentPort + 1, currentMaxPort);
      currentPort = next.port;
      currentMaxPort = next.maxPort;
    }
  }
}

async function tryListenOnPort(port: number, hostname?: string) {
  try {
    const resolvedPort = await listen(port, hostname);
    return { ok: true as const, port: resolvedPort };
  } catch (err: any) {
    return { ok: false as const, err };
  }
}

async function checkAllHostnames(port: number): Promise<{ passed: boolean; port: number }> {
  const result000 = await tryListenOnPort(port, '0.0.0.0');
  if (!result000.ok) return { passed: false, port };

  const result127 = await tryListenOnPort(port, '127.0.0.1');
  if (!result127.ok) return { passed: false, port };

  const resultLocal = await tryListenOnPort(port, 'localhost');
  if (!resultLocal.ok && resultLocal.err.code !== 'EADDRNOTAVAIL') {
    return { passed: false, port };
  }

  const resultIP = await tryListenOnPort(port, ip());
  if (!resultIP.ok) return { passed: false, port };

  return { passed: true, port: resultIP.port };
}

function advancePort(currentPort: number, currentMaxPort: number) {
  const next = getNextPort(currentPort + 1, currentMaxPort);
  return next;
}

async function tryListenDefault(currentPort: number) {
  try {
    await listen(currentPort);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, err };
  }
}

async function handleListenResult(
  result: { ok: true } | { ok: false; err: unknown },
  currentPort: number,
  currentMaxPort: number,
) {
  if (!result.ok) {
    if (currentPort === 0) throw result.err;
    return advancePort(currentPort, currentMaxPort);
  }
  const check = await checkAllHostnames(currentPort);
  if (check.passed) return { port: check.port, maxPort: currentMaxPort, done: true as const };
  return advancePort(currentPort, currentMaxPort);
}

async function tryListenAllInterfaces(port: number, maxPort: number): Promise<number> {
  let currentPort = port;
  let currentMaxPort = maxPort;
  for (;;) {
    const result = await tryListenDefault(currentPort);
    const next = await handleListenResult(result, currentPort, currentMaxPort);
    if ('done' in next) return next.port;
    currentPort = next.port;
    currentMaxPort = next.maxPort;
  }
}

function extractArgs(port: number | string | PortConfig | DetectPortCallback | undefined, callback?: DetectPortCallback) {
  if (port && typeof port === 'object') {
    return { hostname: port.hostname, cb: port.callback, portValue: port.port };
  }
  if (typeof port === 'function') {
    return { hostname: '' as string | undefined, cb: port, portValue: undefined as number | string | undefined };
  }
  return { hostname: '' as string | undefined, cb: callback, portValue: port };
}

function computeMaxPort(parsedPort: number) {
  return Math.min(parsedPort + 10, 65535);
}

function parsePortConfig(port?: number | string | PortConfig | DetectPortCallback, callback?: DetectPortCallback) {
  const { hostname, cb, portValue } = extractArgs(port, callback);
  const parsedPort = parseInt(portValue as unknown as string) || 0;
  const maxPort = computeMaxPort(parsedPort);
  return { hostname, parsedPort, maxPort, cb };
}

export function detectPort(port?: number | PortConfig | string): Promise<number>;
export function detectPort(callback: DetectPortCallback): void;
export function detectPort(port: number | PortConfig | string | undefined, callback: DetectPortCallback): void;
export function detectPort(port?: number | string | PortConfig | DetectPortCallback, callback?: DetectPortCallback) {
  const { hostname, parsedPort, maxPort, cb } = parsePortConfig(port, callback);

  debug('detect free port between [%s, %s)', parsedPort, maxPort);
  if (typeof cb === 'function') {
    const tryFn = hostname
      ? tryListenByHostname(parsedPort, maxPort, hostname)
      : tryListenAllInterfaces(parsedPort, maxPort);
    return tryFn
      .then(detectedPort => cb(null, detectedPort))
      .catch(cb);
  }
  // Promise
  if (hostname) {
    return tryListenByHostname(parsedPort, maxPort, hostname);
  }
  return tryListenAllInterfaces(parsedPort, maxPort);
}
