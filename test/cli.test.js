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
    const givenPort = 9000;
    const res = yield cliTest.execFile(binFile, [givenPort], {});
    const port = parseInt(res.stdout.split(' ')[3], 10);
    port.should.within(givenPort, 65535);
  });

});
