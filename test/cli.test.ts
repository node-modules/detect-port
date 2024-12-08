import stripAnsi from 'strip-ansi';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execaNode } from 'execa';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgFile = path.join(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgFile, 'utf-8'));

describe('test/cli.test.ts', async () => {
  const binFile = path.join(__dirname, '../dist/commonjs/bin/detect-port.js');

  it('should show version', async () => {
    let res = await execaNode(binFile, [ '-v' ]);
    assert(res.stdout, pkg.version);
    res = await execaNode(binFile, [ '--version' ]);
    assert(res.stdout, pkg.version);
  });

  it('should output usage information', async () => {
    let res = await execaNode(binFile, [ '-h' ]);
    assert(res.stdout.includes(pkg.description));
    res = await execaNode(binFile, [ '--help' ]);
    assert(res.stdout.includes(pkg.description));
    res = await execaNode(binFile, [ 'help' ]);
    assert(res.stdout.includes(pkg.description));
    res = await execaNode(binFile, [ 'xxx' ]);
    assert(res.stdout.includes(pkg.description));
  });

  // it('should output available port randomly', { only: true }, async () => {
  //   const res = await execaNode(binFile);
  //   const port = parseInt(stripAnsi(res.stdout).trim(), 10);
  //   assert(port >= 9000 && port < 65535);
  // });

  it('should output available port from the given port', async () => {
    const givenPort = 9000;
    const res = await execaNode(binFile, [ givenPort + '' ]);
    const port = parseInt(stripAnsi(res.stdout).trim(), 10);
    assert(port >= givenPort && port < 65535);
  });

  it('should output verbose logs', async () => {
    const res = await execaNode(binFile, [ '--verbose' ]);
    assert(res.stdout.includes('random'));
  });
});
