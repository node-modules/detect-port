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
const CliTest = require('command-line-test');

const pkg = require('../package');

const cliTest = new CliTest();
const binFile = path.resolve(pkg.bin[pkg.name]);

describe('command-line tool test', () => {

  it('should show version and exit', function *() {
    var res = yield cliTest.execFile(binFile, ['-v'], {});
    res.stdout.should.equal(pkg.version);
    res = yield cliTest.execFile(binFile, ['--version'], {});
    res.stdout.should.containEql(pkg.version);
  });

  it('should output usage information', function *() {
    var res = yield cliTest.execFile(binFile, ['-h'], {});
    res.stdout.should.containEql(pkg.description);
    res = yield cliTest.execFile(binFile, ['--help'], {});
    res.stdout.should.containEql(pkg.description);
    res = yield cliTest.execFile(binFile, ['help'], {});
    res.stdout.should.containEql(pkg.description);
    res = yield cliTest.execFile(binFile, ['xxx'], {});
    res.stdout.should.containEql(pkg.description);
  });

  it('should output available port randomly', function *() {
    const res = yield cliTest.execFile(binFile, [], {});
    const port = parseInt(res.stdout.split(' ')[3], 10);
    port.should.within(9000, 65535);
  });

  it('should output available port from the given port', function *() {
    const givenPort = 8080;
    var res = yield cliTest.execFile(binFile, [givenPort], {});
    const port = parseInt(res.stdout.split(' ')[3], 10);
    port.should.within(givenPort, 65535);
  });

});
