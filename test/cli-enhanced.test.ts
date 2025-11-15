import { describe, it, expect, beforeAll } from 'vitest';
import stripAnsi from 'strip-ansi';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execaNode } from 'execa';
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:net';
import { once } from 'node:events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgFile = path.join(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgFile, 'utf-8'));

describe('test/cli-enhanced.test.ts - Enhanced CLI coverage', () => {
  const binFile = path.join(__dirname, '../dist/commonjs/bin/detect-port.js');
  const servers: Server[] = [];

  beforeAll(() => {
    // Ensure dist folder exists (should be built)
    try {
      readFileSync(binFile);
    } catch (err) {
      throw new Error('Binary file not found. Run npm run prepublishOnly first.', { cause: err });
    }
  });

  describe('Help flags', () => {
    it('should show help with -h flag', async () => {
      const res = await execaNode(binFile, ['-h']);
      expect(res.stdout).toContain(pkg.description);
      expect(res.stdout).toContain('Usage:');
      expect(res.stdout).toContain('Options:');
      expect(res.stdout).toContain('-v, --version');
      expect(res.stdout).toContain('-h, --help');
      expect(res.stdout).toContain('--verbose');
      expect(res.stdout).toContain(pkg.homepage);
    });

    it('should show help with --help flag', async () => {
      const res = await execaNode(binFile, ['--help']);
      expect(res.stdout).toContain(pkg.description);
      expect(res.stdout).toContain('Usage:');
    });

    it('should show help with help argument', async () => {
      const res = await execaNode(binFile, ['help']);
      expect(res.stdout).toContain(pkg.description);
      expect(res.stdout).toContain('Usage:');
    });

    it('should show help with invalid string argument', async () => {
      const res = await execaNode(binFile, ['not-a-port']);
      expect(res.stdout).toContain(pkg.description);
      expect(res.stdout).toContain('Usage:');
    });
  });

  describe('Version flags', () => {
    it('should show version with -v flag', async () => {
      const res = await execaNode(binFile, ['-v']);
      expect(res.stdout.trim()).toBe(pkg.version);
    });

    it('should show version with --version flag', async () => {
      const res = await execaNode(binFile, ['--version']);
      expect(res.stdout.trim()).toBe(pkg.version);
    });

    it('should show version with -V flag (uppercase)', async () => {
      const res = await execaNode(binFile, ['-V']);
      expect(res.stdout.trim()).toBe(pkg.version);
    });

    it('should show version with --VERSION flag (uppercase)', async () => {
      const res = await execaNode(binFile, ['--VERSION']);
      expect(res.stdout.trim()).toBe(pkg.version);
    });
  });

  describe('Port detection with valid ports', () => {
    it('should detect available port from given port', async () => {
      const givenPort = 12000;
      const res = await execaNode(binFile, [givenPort.toString()]);
      const port = parseInt(stripAnsi(res.stdout).trim(), 10);
      expect(port).toBeGreaterThanOrEqual(givenPort);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should detect random port when no arguments provided', async () => {
      const res = await execaNode(binFile, []);
      const port = parseInt(stripAnsi(res.stdout).trim(), 10);
      expect(port).toBeGreaterThanOrEqual(9000);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle high port numbers', async () => {
      const givenPort = 60000;
      const res = await execaNode(binFile, [givenPort.toString()]);
      const port = parseInt(stripAnsi(res.stdout).trim(), 10);
      expect(port).toBeGreaterThanOrEqual(givenPort);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle low port numbers', async () => {
      const givenPort = 3000;
      const res = await execaNode(binFile, [givenPort.toString()]);
      const port = parseInt(stripAnsi(res.stdout).trim(), 10);
      expect(port).toBeGreaterThanOrEqual(3000);
      expect(port).toBeLessThanOrEqual(65535);
    });
  });

  describe('Verbose mode', () => {
    it('should output verbose logs with --verbose flag', async () => {
      const res = await execaNode(binFile, ['--verbose']);
      expect(res.stdout).toContain('random');
      expect(res.stdout).toContain('get available port');
    });

    it('should output verbose logs with port and --verbose flag', async () => {
      const res = await execaNode(binFile, ['13000', '--verbose']);
      expect(res.stdout).toContain('get available port');
      expect(res.stdout).toMatch(/\d+/); // Should contain port number
    });

    it('should show when port is occupied in verbose mode', async () => {
      // Create a server on a specific port
      const port = 15000;
      const server = createServer();
      server.listen(port, '0.0.0.0');
      await once(server, 'listening');

      const res = await execaNode(binFile, [port.toString(), '--verbose']);
      expect(res.stdout).toContain('port');
      expect(res.stdout).toContain('occupied');
      
      server.close();
    }, 10000);

    it('should output verbose logs for random port', async () => {
      const res = await execaNode(binFile, ['--verbose']);
      expect(res.stdout).toContain('randomly');
      const lines = res.stdout.split('\n');
      const portLine = lines.find(line => /^\d+$/.test(line.trim()));
      if (portLine) {
        const port = parseInt(portLine.trim(), 10);
        expect(port).toBeGreaterThanOrEqual(9000);
      }
    });
  });

  describe('Argument parsing', () => {
    it('should handle --verbose flag after port number', async () => {
      const res = await execaNode(binFile, ['14000', '--verbose']);
      const output = res.stdout;
      expect(output).toContain('get available port');
      expect(output).toMatch(/\d+/);
      const port = parseInt(stripAnsi(output).match(/\d+/)?.[0] || '0', 10);
      expect(port).toBeGreaterThanOrEqual(14000);
    });

    it('should prioritize version flag over port detection', async () => {
      const res = await execaNode(binFile, ['-v', '8080']);
      expect(res.stdout.trim()).toBe(pkg.version);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero as port', async () => {
      const res = await execaNode(binFile, ['0']);
      const port = parseInt(stripAnsi(res.stdout).trim(), 10);
      expect(port).toBeGreaterThanOrEqual(0);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle port 1', async () => {
      const res = await execaNode(binFile, ['1']);
      const port = parseInt(stripAnsi(res.stdout).trim(), 10);
      // Port 1 requires elevated privileges, should return available port
      expect(port).toBeGreaterThanOrEqual(1);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should handle multiple --verbose flags', async () => {
      // Multiple --verbose flags are treated like help text since first is not a number
      const res = await execaNode(binFile, ['--verbose', '--verbose']);
      expect(res.stdout).toContain(pkg.description);
      expect(res.stdout).toContain('Usage:');
    });
  });

  describe('Output format', () => {
    it('should output only port number in non-verbose mode', async () => {
      const res = await execaNode(binFile, ['16000']);
      const output = stripAnsi(res.stdout).trim();
      const port = parseInt(output, 10);
      expect(port).toBeGreaterThanOrEqual(16000);
      // Output should be just a number
      expect(output).toMatch(/^\d+$/);
    });

    it('should output port number even for random port in non-verbose mode', async () => {
      const res = await execaNode(binFile, []);
      const output = stripAnsi(res.stdout).trim();
      const port = parseInt(output, 10);
      expect(port).toBeGreaterThanOrEqual(9000);
      expect(output).toMatch(/^\d+$/);
    });
  });
});
