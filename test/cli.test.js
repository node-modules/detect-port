'use strict';

const path = require('path');
const assert = require('assert');
const pkg = require('../package');
const CliTest = require('command-line-test');

const cliTest = new CliTest();
const binFile = path.resolve(pkg.bin[pkg.name]);

describe('command-line tool test', () => {

  it('should show version and exit', function* () {
    let res = yield cliTest.execFile(binFile, [ '-v' ], {});
    assert(res.stdout === pkg.version);
    res = yield cliTest.execFile(binFile, [ '--version' ], {});
    assert(res.stdout.includes(pkg.version));
  });

  it('should output usage information', function* () {
    let res = yield cliTest.execFile(binFile, [ '-h' ], {});
    assert(res.stdout.includes(pkg.description));
    res = yield cliTest.execFile(binFile, [ '--help' ], {});
    assert(res.stdout.includes(pkg.description));
    res = yield cliTest.execFile(binFile, [ 'help' ], {});
    assert(res.stdout.includes(pkg.description));
    res = yield cliTest.execFile(binFile, [ 'xxx' ], {});
    assert(res.stdout.includes(pkg.description));
  });

  it('should output available port randomly', function* () {
    const res = yield cliTest.execFile(binFile, [], {});
    const port = parseInt(res.stdout.trim(), 10);
    assert(port >= 9000 && port < 65535);
  });

  it('should output available port from the given port', function* () {
    const givenPort = 9000;
    const res = yield cliTest.execFile(binFile, [ givenPort ], {});
    const port = parseInt(res.stdout.trim(), 10);
    assert(port >= givenPort && port < 65535);
  });

  it('should output verbose logs', function* () {
    const res = yield cliTest.execFile(binFile, [ '--verbose' ], {});
    assert(res.stdout.includes('random'));
  });

});
