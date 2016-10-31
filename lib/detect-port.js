/* ================================================================
 * detect-port by xdf(xudafeng[at]126.com)
 *
 * first created at : Tue Mar 17 2015 00:16:10 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright xdf
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

'use strict';

const net = require('net');

module.exports = function() {
  const args = Array.prototype.slice.call(arguments);

  const promise = new Promise((resolve, reject) => {
    if (!args.length) {
      reject('wrong number of arguments');
    }

    const port = parseInt(args[0], 10);

    if (isNaN(port)) {
      reject(`wrong type of arguments with: '${args[0]}'`);
    }

    const loop = port => {
      const socket = new net.Socket();

      socket.once('error', () => {
        socket.removeAllListeners('error');
        socket.removeAllListeners('connect');
        socket.end();
        socket.destroy();
        socket.unref();

        const server = new net.Server();

        server.on('error', () => {
          port++;
          loop(port);
        });

        server.listen(port, () => {
          server.once('close', () => {
            resolve(port);
          });
          server.close();
        });
      });

      socket.once('connect', () => {
        port++;
        loop(port);
        socket.removeAllListeners('error');
        socket.removeAllListeners('connect');
        socket.end();
        socket.destroy();
        socket.unref();
      });

      socket.connect({
        port: port
      });
    };

    loop(port);
  });

  if (args.length > 1) {
    const cb = args[1];

    promise.then(data => {
      cb.call(this, null, data);
    }).catch(err => {
      cb.call(this, err);
    });
  } else {
    return promise;
  }
};
