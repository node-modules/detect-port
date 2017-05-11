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
  function handleError() {
    port++;
    if (port >= maxPort) {
      debug('port: %s >= maxPort: %s, give up and use random port', port, maxPort);
      port = 0;
      maxPort = 0;
    }
    tryListen(port, maxPort, callback);
  }

  // 1. check 0.0.0.0
  listen(port, null, (err, realPort) => {
    if (port === 0) {
      return callback(err, realPort);
    }

    if (err) {
      return handleError(err);
    }

    // 2. check localhost
    listen(port, 'localhost', (err, realPort) => {
      if (err) {
        return handleError(err);
      }

      callback(null, realPort);
    });
  });
}

function listen(port, hostname, callback) {
  const server = new net.Server();

  server.on('error', err => {
    debug('listen %s error: %s', port, err);
    server.close();
    return callback(err);
  });

  server.listen(port, hostname, () => {
    port = server.address().port;
    server.close();
    debug('get %s free port: %s', hostname, port);
    return callback(null, port);
  });
}
