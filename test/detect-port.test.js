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

var detect = require('..');

describe('lib/index.js', function() {
  describe('detect()', function() {
    it('should be a function', function() {
      detect.should.be.a.Function;
    });
    it('should return correct port number', function *() {
      var port = yield detect(8080);
      port.should.be.a.Number;
    });
    it('should with verbose', function *() {
      global.__detect = global.__detect || {
        options: {
          verbose: true
        }
      };
      var port = yield detect(8080);
      port.should.be.a.Number;
    });
    it('should get correct port number in callback', function() {
      detect(8080, function(error, port) {
        port.should.be.a.Number;
      });
    });
  });
});
