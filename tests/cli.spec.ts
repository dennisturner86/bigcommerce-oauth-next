import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CLI_ENTRY_PATH = '../src/cli.ts';

let initCommandMock: ReturnType<typeof vi.fn>;

// Top-level mock so Vitest can hoist it correctly.
// We route calls through `initCommandMock`, which we reassign in each test.
vi.mock('../src/cli/commands/init.js', () => ({
  initCommand: (...args: unknown[]) => initCommandMock(...(args as any)),
}));

describe('CLI entrypoint (bigcommerce-oauth-next)', () => {
  const originalArgv = process.argv.slice();
  const originalExit = process.exit;
  const originalError = console.error;

  let exitMock: ReturnType<typeof vi.fn>;
  let errorMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    process.argv = originalArgv.slice();

    initCommandMock = vi.fn().mockResolvedValue(undefined);
    exitMock = vi.fn();
    errorMock = vi.fn();

    // Override process.exit to prevent the test process from exiting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).exit = exitMock;

    // eslint-disable-next-line no-console
    console.error = errorMock as unknown as typeof console.error;

    await vi.resetModules();
  });

  afterEach(() => {
    process.argv = originalArgv.slice();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).exit = originalExit;
    // eslint-disable-next-line no-console
    console.error = originalError;

    vi.clearAllMocks();
  });

  it('dispatches the "init" command and forwards arguments to initCommand', async () => {
    // Simulate: node cli.js init src/app/(oauth)
    process.argv = ['node', 'cli.js', 'init', 'src/app/(oauth)'];

    await import(CLI_ENTRY_PATH);

    expect(initCommandMock).toHaveBeenCalledTimes(1);
    expect(initCommandMock).toHaveBeenCalledWith(['src/app/(oauth)']);

    expect(exitMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });

  it('prints an error and exits with code 1 for unknown commands', async () => {
    // Simulate: node cli.js foo bar
    process.argv = ['node', 'cli.js', 'foo', 'bar'];

    await import(CLI_ENTRY_PATH);

    expect(initCommandMock).not.toHaveBeenCalled();

    expect(errorMock).toHaveBeenCalledWith('Unknown command: foo');
    expect(errorMock).toHaveBeenCalledWith('Usage: bigcommerce-oauth-next init <path>');

    expect(exitMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('prints an error and exits with code 1 when no command is provided', async () => {
    // Simulate: node cli.js  (no command)
    process.argv = ['node', 'cli.js'];

    await import(CLI_ENTRY_PATH);

    expect(initCommandMock).not.toHaveBeenCalled();

    expect(errorMock).toHaveBeenCalledWith('Unknown command: undefined');
    expect(errorMock).toHaveBeenCalledWith('Usage: bigcommerce-oauth-next init <path>');

    expect(exitMock).toHaveBeenCalledTimes(1);
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
