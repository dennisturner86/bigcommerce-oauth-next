import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { copyDirectory } from '../../../src/cli/utils/fileCopy.js';

describe('copyDirectory', () => {
  let tmpRoot: string;
  let srcDir: string;
  let destDir: string;

  beforeEach(() => {
    // Create an isolated temp directory for each test
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'copy-dir-test-'));

    srcDir = path.join(tmpRoot, 'src');
    destDir = path.join(tmpRoot, 'dest');

    // Build a small source tree:
    //
    // src/
    //   file.txt
    //   nested/
    //     inner.txt
    //
    fs.mkdirSync(srcDir, { recursive: true });

    fs.writeFileSync(path.join(srcDir, 'file.txt'), 'root file');

    const nested = path.join(srcDir, 'nested');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, 'inner.txt'), 'nested file');
  });

  afterEach(() => {
    // Clean up the temp tree
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('creates the destination directory if it does not exist and copies all files', () => {
    // destDir does not exist yet
    expect(fs.existsSync(destDir)).toBe(false);

    copyDirectory(srcDir, destDir);

    // destDir should now exist
    expect(fs.existsSync(destDir)).toBe(true);

    // root-level file copied
    const destFile = path.join(destDir, 'file.txt');
    expect(fs.existsSync(destFile)).toBe(true);
    expect(fs.readFileSync(destFile, 'utf8')).toBe('root file');

    // nested directory and file copied
    const nestedDir = path.join(destDir, 'nested');
    const nestedFile = path.join(nestedDir, 'inner.txt');

    expect(fs.existsSync(nestedDir)).toBe(true);
    expect(fs.existsSync(nestedFile)).toBe(true);
    expect(fs.readFileSync(nestedFile, 'utf8')).toBe('nested file');
  });

  it('overwrites existing files in the destination directory', () => {
    // Pre-create dest with conflicting files
    fs.mkdirSync(destDir, { recursive: true });

    const destFile = path.join(destDir, 'file.txt');
    fs.writeFileSync(destFile, 'old content');

    const nestedDir = path.join(destDir, 'nested');
    fs.mkdirSync(nestedDir, { recursive: true });
    const nestedFile = path.join(nestedDir, 'inner.txt');
    fs.writeFileSync(nestedFile, 'old nested');

    copyDirectory(srcDir, destDir);

    // Contents should now match the source, i.e. have been overwritten
    expect(fs.readFileSync(destFile, 'utf8')).toBe('root file');
    expect(fs.readFileSync(nestedFile, 'utf8')).toBe('nested file');
  });
});
