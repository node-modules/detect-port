'use strict';

const debug = require('debug')('detect-port');
const net = require('net');

module.exports = (port, callback) => {
  if (typeof port === 'function') {
    callback = port;
    port = null;
  }
  port = parseInt(port) || 0;
  let maxPort = port + 10;
  if (maxPort > 65535) {
    maxPort = 65535;
  }
  debug('detect free port between [%s, %s)', port, maxPort);
  if (typeof callback === 'function') {
    return tryListen(port, maxPort, callback);
  }
  // promise
  return new Promise(resolve => {
    tryListen(port, maxPort, (_, realPort) => {
      resolve(realPort);
    });
  });
};

function tryListen(port, maxPort, callback) {
  const server = new net.Server();

  server.on('error', err => {
    debug('listen %s error: %s', port, err);
    if (port === 0) {
      return callback(err);
    }

    port++;
    if (port >= maxPort) {
      debug('port: %s >= maxPort: %s, give up and use random port', port, maxPort);
      port = 0;
      maxPort = 0;
    }
    server.close();
    return tryListen(port, maxPort, callback);
  });

  server.listen({ port }, () => {
    port = server.address().port;
    server.close();
    debug('get free port: %s', port);
    callback(null, port);
  });
}
