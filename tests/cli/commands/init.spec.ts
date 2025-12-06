import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Path to the module under test (TS source, not dist)
const INIT_COMMAND_PATH = '../../../src/cli/commands/init.ts';

// We'll route the mocked module through this function:
let copyDirectoryMock: ReturnType<typeof vi.fn>;

// IMPORTANT: mock the *actual* module that init.ts imports after resolution.
// init.ts: import { copyDirectory } from '../utils/fileCopy.js';
// That resolves to src/cli/utils/fileCopy.ts in this repo layout.
vi.mock('../../../src/cli/utils/fileCopy.ts', () => ({
  copyDirectory: (...args: unknown[]) => copyDirectoryMock(...(args as any)),
}));

describe('initCommand', () => {
  const originalExit = process.exit;
  const originalError = console.error;
  const originalLog = console.log;

  let exitMock: ReturnType<typeof vi.fn>;
  let errorMock: ReturnType<typeof vi.fn>;
  let logMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    exitMock = vi.fn();
    errorMock = vi.fn();
    logMock = vi.fn();
    copyDirectoryMock = vi.fn();

    // Mock process.exit so it doesn't actually terminate the test process
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).exit = exitMock;

    // Mock logging functions
    console.error = errorMock as any;
    console.log = logMock as any;

    // Ensure fresh module state for each test
    await vi.resetModules();
  });

  afterEach(() => {
    // Restore globals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).exit = originalExit;
    console.error = originalError;
    console.log = originalLog;

    vi.clearAllMocks();
  });

  it('copies templates into the target directory when path is provided', async () => {
    // Import module fresh *after* resetModules & mocks
    const { initCommand } = await import(INIT_COMMAND_PATH);

    const projectRoot = process.cwd();
    const target = 'src/app/(oauth)';
    const expectedDest = path.resolve(projectRoot, target);

    await initCommand([target]);

    // Assert copyDirectory was called once
    expect(copyDirectoryMock).toHaveBeenCalledTimes(1);
    const [actualTemplateDir, actualDest] = copyDirectoryMock.mock.calls[0]!;

    // Destination should match our resolved path
    expect(actualDest).toBe(expectedDest);

    // Template dir should end with /templates/ts (or \templates\ts on Windows)
    expect(String(actualTemplateDir)).toMatch(
      new RegExp(`${path.sep}templates${path.sep}ts$`.replace(/\\/g, '\\\\')),
    );

    // Logs should be shown
    expect(logMock).toHaveBeenCalledWith(
      `Scaffolding BigCommerce OAuth Next files to:\n  ${expectedDest}`,
    );
    expect(logMock).toHaveBeenCalledWith('Done!');

    // No exit or error on success
    expect(exitMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });

  it('prints an error and exits with code 1 when no target path is provided', async () => {
    const { initCommand } = await import(INIT_COMMAND_PATH);

    // Because your implementation calls process.exit(1) but does not `return`
    // afterwards, the code *continues* and hits path.resolve(projectRoot, targetPath)
    // with targetPath = undefined, which throws. In the real CLI this never
    // happens (process.exit terminates), but in tests we need to swallow that.
    try {
      // No args -> targetPath is undefined
      await initCommand([]);
    } catch {
      // We don't care about the thrown TypeError here; we only care that
      // logs and exit were invoked as expected.
    }

    expect(errorMock).toHaveBeenNthCalledWith(1, 'Missing target path.');
    expect(errorMock).toHaveBeenNthCalledWith(2, 'Usage: bigcommerce-oauth-next init <path>');

    expect(exitMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(1);

    // Should not attempt to copy (or at least not before throwing)
    expect(copyDirectoryMock).not.toHaveBeenCalled();
  });
});
