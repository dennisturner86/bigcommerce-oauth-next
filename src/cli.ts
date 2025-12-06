#!/usr/bin/env node
import { initCommand } from './cli/commands/init.js';

/**
 * Extracted CLI arguments.
 *
 * Structure:
 *   [0] = "node"
 *   [1] = path to this CLI file
 *   [2] = command name (e.g. "init")
 *   [3...] = additional arguments for the command
 */
const [, , command, ...rest] = process.argv;

/**
 * Main entrypoint for the `bigcommerce-oauth-next` command-line interface.
 *
 * This executable provides a thin command dispatcher that routes user
 * commands to their corresponding handler implementations. It is intended
 * to be invoked either directly via:
 *
 * ```bash
 * npx bigcommerce-oauth-next init ./some/path
 * ```
 *
 * or indirectly via local package binaries:
 *
 * ```bash
 * pnpm exec bigcommerce-oauth-next init ./src/app
 * ```
 *
 * Supported commands:
 * -------------------
 * - `init <path>`
 *   Copies the built-in Next.js OAuth template files into the specified
 *   project directory. Delegates to {@link initCommand}.
 *
 * If the user provides an unknown command or insufficient arguments,
 * the CLI prints a usage guide and exits with a non-zero status code.
 *
 * This file serves as the lightweight command router; all substantial
 * functionality (template copying, validation, etc.) lives within the
 * dedicated command modules under `src/cli/commands/`.
 *
 * @returns {Promise<void>} Resolves when command execution completes.
 */
async function main() {
  switch (command) {
    case 'init':
      await initCommand(rest);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error(`Usage: bigcommerce-oauth-next init <path>`);
      process.exit(1);
  }
}

main();
