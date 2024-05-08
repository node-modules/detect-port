import stripAnsi from 'strip-ansi';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { execaNode } from 'execa';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgFile = path.join(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgFile, 'utf-8'));

const execaNodeWithLoader = (async (scripPath, args, options) => {
  return execaNode(scripPath, args, {
    ...options,
    verbose: true,
    nodeOptions: [ '--loader', 'tsx' ],
  });
}) as typeof execaNode;

describe('test/cli.test.js', async () => {
  const binFile = path.join(__dirname, '../bin/detect-port.ts');

  it('should show version', async () => {
    let res = await execaNodeWithLoader(binFile, [ '-v' ]);
    assert(res.stdout, pkg.version);
    res = await execaNodeWithLoader(binFile, [ '--version' ]);
    assert(res.stdout, pkg.version);
  });

  it('should output usage information', async () => {
    let res = await execaNodeWithLoader(binFile, [ '-h' ]);
    assert(res.stdout.includes(pkg.description));
    res = await execaNodeWithLoader(binFile, [ '--help' ]);
    assert(res.stdout.includes(pkg.description));
    res = await await execaNodeWithLoader(binFile, [ 'help' ]);
    assert(res.stdout.includes(pkg.description));
    res = await await execaNodeWithLoader(binFile, [ 'xxx' ]);
    assert(res.stdout.includes(pkg.description));
  });

  it('should output available port randomly', { only: true }, async () => {
    const res = await execaNodeWithLoader(binFile);
    const port = parseInt(stripAnsi(res.stdout).trim(), 10);
    assert(port >= 9000 && port < 65535);
  });

  it('should output available port from the given port', async () => {
    const givenPort = 9000;
    const res = await execaNodeWithLoader(binFile, [ givenPort + '' ]);
    const port = parseInt(stripAnsi(res.stdout).trim(), 10);
    assert(port >= givenPort && port < 65535);
  });

  it('should output verbose logs', async () => {
    const res = await execaNodeWithLoader(binFile, [ '--verbose' ]);
    assert(res.stdout.includes('random'));
  });
});
