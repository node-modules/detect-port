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

var ipv4 = require('ipv4');
var net = require('net');

var inject = function(port) {
  var options = global.__detect ? global.__detect.options : {};

  if (options.verbose) {
    console.log('port %d was occupied', port);
  }
};

function detect(port, fn) {

  var _detect = function(_fn) {
    var socket = new net.Socket();
    socket.once('error', function() {
      socket.removeAllListeners('connect');
      socket.removeAllListeners('error');
      socket.end();
      socket.destroy();
      socket.unref();
      var server = new net.Server();
      server.on('error', function() {
        inject(port);
        port++;

        if (fn) {
          _detect(_fn);
        } else {
          detect(port)(_fn);
        }
      });

      server.listen(port, function() {
        server.once('close', function() {
          _fn(null, port);
        });
        server.close();
      });
    });
    socket.once('connect', function() {
      inject(port);
      port++;

      if (fn) {
        _detect(_fn);
      } else {
        detect(port)(_fn);
      }
      socket.removeAllListeners('connect');
      socket.removeAllListeners('error');
      socket.end();
      socket.destroy();
      socket.unref();
    });
    socket.connect({
      port: port,
      host: ipv4
    });
  };

  return fn ? _detect(fn) : _detect;
}

module.exports = detect;
