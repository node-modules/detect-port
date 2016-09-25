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

const path = require('path');
const detect = require('..');
const CliTest = require('command-line-test');

const pkg = require('../package');

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

  describe('command-line tool', function() {
    it('command-line tool should be ok', function *() {
      const cliTest = new CliTest();
      const binFile = path.resolve(pkg.bin['detect-port'])
      const res = yield cliTest.execFile(binFile, [], {});
      res.stdout.should.containEql('port');
    });
  });
});
