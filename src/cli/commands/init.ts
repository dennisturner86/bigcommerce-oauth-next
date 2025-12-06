import * as path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyDirectory } from '../utils/fileCopy.js';

/**
 * Absolute file path of the current module.
 *
 * In ESM environments, `__filename` is not defined by default.
 * This value is reconstructed using `import.meta.url` to provide
 * equivalent functionality to CommonJS modules.
 */
const __filename = fileURLToPath(import.meta.url);

/**
 * Directory name of the current module.
 *
 * ESM modules do not provide `__dirname` by default. This value
 * is derived from the reconstructed `__filename` and is used for
 * resolving paths relative to the module file (e.g., template
 * directories bundled with the package).
 */
const __dirname = dirname(__filename);

/**
 * Initializes a new project directory by copying the built-in
 * TypeScript template set into a user-specified location.
 *
 * This function is executed as part of the `bigcommerce-oauth-next init`
 * CLI command. It performs the following steps:
 *
 * 1. Validates that a target path was provided.
 * 2. Resolves the final absolute output directory based on the user's
 *    current working directory.
 * 3. Locates the packaged template directory inside the installed
 *    `bigcommerce-oauth-next` package.
 * 4. Recursively copies all template files into the destination folder.
 *
 * The resulting scaffold includes example route handlers, UI components,
 * and composition files that serve as a starting point for integrating
 * BigCommerce OAuth flows into a Next.js application.
 *
 * @async
 * @param {string[]} args - CLI arguments passed to the `init` command.
 *   The first argument must be a relative or absolute path describing
 *   where the templates should be copied within the user's project.
 *
 * @throws Will terminate the process with exit code `1` if no path
 *         argument is provided.
 *
 * @example
 * ```bash
 * npx bigcommerce-oauth-next init ./src/app
 * ```
 *
 * @example
 * ```ts
 * // Programmatic usage (internal)
 * await initCommand(["./src/app/bc"]);
 * ```
 */
export async function initCommand(args: string[]) {
  const targetPath = args[0];

  if (!targetPath) {
    console.error('Missing target path.');
    console.error('Usage: bigcommerce-oauth-next init <path>');
    process.exit(1);
  }

  // Resolve the user-specified destination directory
  const projectRoot = process.cwd();
  const dest = path.resolve(projectRoot, targetPath);

  // Resolve the path to the TypeScript template directory bundled with the package
  const templateDir = path.resolve(__dirname, '../../../templates/ts');

  console.log(`Scaffolding BigCommerce OAuth Next files to:\n  ${dest}`);

  // Copy the entire template directory to the destination
  copyDirectory(templateDir, dest);

  console.log('Done!');
}
