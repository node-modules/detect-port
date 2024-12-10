#!/usr/bin/env node

import path from 'node:path';
import { readFileSync } from 'node:fs';
import { detectPort } from '../detect-port.js';

const pkgFile = path.join(__dirname, '../../../package.json');
const pkg = JSON.parse(readFileSync(pkgFile, 'utf-8'));

const args = process.argv.slice(2);
let arg_0 = args[0];

if (arg_0 && [ '-v', '--version' ].includes(arg_0.toLowerCase())) {
  console.log(pkg.version);
  process.exit(0);
}

const removeByValue = (arr: string[], val: string) => {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === val) {
      arr.splice(i, 1);
      break;
    }
  }
};

const port = parseInt(arg_0, 10);
const isVerbose = args.includes('--verbose');

removeByValue(args, '--verbose');
arg_0 = args[0];
if (!arg_0) {
  const random = Math.floor(9000 + Math.random() * (65535 - 9000));

  detectPort(random, (err, port) => {
    if (isVerbose) {
      if (err) {
        console.log(`get available port failed with ${err}`);
      }
      console.log(`get available port ${port} randomly`);
    } else {
      console.log(port || random);
    }
  });
} else if (isNaN(port)) {
  console.log();
  console.log(`  \u001b[37m${pkg.description}\u001b[0m`);
  console.log();
  console.log('  Usage:');
  console.log();
  console.log(`    ${pkg.name} [port]`);
  console.log();
  console.log('  Options:');
  console.log();
  console.log('    -v, --version    output version and exit');
  console.log('    -h, --help       output usage information');
  console.log('    --verbose        output verbose log');
  console.log();
  console.log('  Further help:');
  console.log();
  console.log(`    ${pkg.homepage}`);
  console.log();
} else {
  detectPort(port, (err, _port) => {
    if (isVerbose) {
      if (err) {
        console.log(`get available port failed with ${err}`);
      }

      if (port !== _port) {
        console.log(`port ${port} was occupied`);
      }

      console.log(`get available port ${_port}`);
    } else {
      console.log(_port || port);
    }
  });
}
