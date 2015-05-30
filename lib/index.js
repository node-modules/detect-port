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

var http = require('http');
var localhost = '0.0.0.0';

var inject = function(port) {
  var options = global.__detect ? global.__detect.options : {};

  if (options.verbose) {
    console.log('port %d was occupied', port);
  }
};

function detect(port, fn) {

  var _detect = function(_fn) {
    var server = http.createServer();

    server.listen(port, localhost, function() {
      server.once('close', function() {

        if (fn) {
          _fn(port);
        } else {
          _fn(null, port);
        }
      });
      server.close();
    });

    server.on('error', function() {
      inject(port);
      port++;

      if (fn) {
        _detect(_fn);
      } else {
        detect(port)(_fn);
      }
    });
  };
  return fn ? _detect(fn) : _detect;
}

module.exports = detect;
