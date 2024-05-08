const path = require('path');
const assert = require('assert');
const CliTest = require('command-line-test');

const pkg = require('../package');

const cliTest = new CliTest();
const binFile = path.resolve(pkg.bin[pkg.name]);

describe('command-line tool test', () => {

  it('should show version and exit', async () => {
    let res = await cliTest.exec(`node ${binFile} -v`, {});
    assert.equal(res.stdout, pkg.version);
    res = await cliTest.exec(`node ${binFile} --version`, {});
    assert(res.stdout.includes(pkg.version));
  });

  it('should output usage information', async () => {
    let res = await cliTest.exec(`node ${binFile} -h`, {});
    assert(res.stdout.includes(pkg.description));
    res = await cliTest.exec(`node ${binFile} --help`, {});
    assert(res.stdout.includes(pkg.description));
    res = await cliTest.exec(`node ${binFile} help`, {});
    assert(res.stdout.includes(pkg.description));
    res = await cliTest.exec(`node ${binFile} xxx`, {});
    assert(res.stdout.includes(pkg.description));
  });

  it('should output available port randomly', async () => {
    const res = await cliTest.exec(`node ${binFile}`, {});
    const port = parseInt(res.stdout.trim(), 10);
    assert(port >= 9000 && port < 65535);
  });

  it('should output available port from the given port', async () => {
    const givenPort = 9000;
    const res = await cliTest.exec(`node ${binFile} ${givenPort}`, {});
    const port = parseInt(res.stdout.trim(), 10);
    assert(port >= givenPort && port < 65535);
  });

  it('should output verbose logs', async () => {
    const res = await cliTest.exec(`node ${binFile} --verbose`, {});
    assert(res.stdout.includes('random'));
  });

});
