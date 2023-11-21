import net from 'node:net';
import { ip } from 'address';
import { debuglog } from 'node:util';

const debug = debuglog('detect-port');

type DetectPortCallback = (err: Error | null, port: number) => void;

interface PortConfig {
  port?: number | string;
  hostname?: string | undefined;
  callback?: DetectPortCallback;
}

export default function detectPort(port?: number | PortConfig | string): Promise<number>;
export default function detectPort(callback: DetectPortCallback): void;
export default function detectPort(port: number | PortConfig | string | undefined, callback: DetectPortCallback): void;
export default function detectPort(port?: number | string | PortConfig | DetectPortCallback, callback?: DetectPortCallback) {
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
    return tryListen(port, maxPort, hostname, callback);
  }
  // promise
  return new Promise(resolve => {
    tryListen(port as number, maxPort, hostname, (_, realPort) => {
      resolve(realPort);
    });
  });
}

function tryListen(port: number, maxPort: number, hostname: string | undefined, callback: (...args: any[]) => void) {
  function handleError() {
    port++;
    if (port >= maxPort) {
      debug('port: %s >= maxPort: %s, give up and use random port', port, maxPort);
      port = 0;
      maxPort = 0;
    }
    tryListen(port, maxPort, hostname, callback);
  }

  // use user hostname
  if (hostname) {
    listen(port, hostname, (err, realPort) => {
      if (err) {
        if ((err as any).code === 'EADDRNOTAVAIL') {
          return callback(new Error('the ip that is not unknown on the machine'));
        }
        return handleError();
      }

      callback(null, realPort);
    });
  } else {
    // 1. check null
    listen(port, void 0, (err, realPort) => {
      // ignore random listening
      if (port === 0) {
        return callback(err, realPort);
      }

      if (err) {
        return handleError();
      }

      // 2. check 0.0.0.0
      listen(port, '0.0.0.0', err => {
        if (err) {
          return handleError();
        }

        // 3. check localhost
        listen(port, 'localhost', err => {
          // if localhost refer to the ip that is not unkonwn on the machine, you will see the error EADDRNOTAVAIL
          // https://stackoverflow.com/questions/10809740/listen-eaddrnotavail-error-in-node-js
          if (err && (err as any).code !== 'EADDRNOTAVAIL') {
            return handleError();
          }

          // 4. check current ip
          listen(port, ip(), (err, realPort) => {
            if (err) {
              return handleError();
            }

            callback(null, realPort);
          });
        });
      });
    });
  }
}

function listen(port: number, hostname: string | undefined, callback: (...args: any[]) => void) {
  const server = new net.Server();

  server.on('error', err => {
    debug('listen %s:%s error: %s', hostname, port, err);
    server.close();

    if ((err as any).code === 'ENOTFOUND') {
      debug('ignore dns ENOTFOUND error, get free %s:%s', hostname, port);
      return callback(null, port);
    }

    return callback(err);
  });

  server.listen(port, hostname, () => {
    port = (server.address() as net.AddressInfo).port;
    server.close();
    debug('get free %s:%s', hostname, port);
    return callback(null, port);
  });
}
