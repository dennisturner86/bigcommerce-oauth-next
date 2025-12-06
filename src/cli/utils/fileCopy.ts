import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Recursively copies the contents of a source directory into a destination
 * directory. This utility is used by the CLI scaffolding command to copy
 * template files from the installed package into a user-specified project
 * directory.
 *
 * Behavior:
 * - Creates the destination directory if it does not already exist.
 * - Recursively traverses all subdirectories.
 * - Copies files verbatim, preserving file names and directory structure.
 * - Overwrites existing files with the same name in the destination path.
 *
 * This function does not perform filtering, transformation, or templating.
 * It is intended to be simple, deterministic, and side-effect conscious.
 *
 * @param {string} src - The absolute or relative path of the source directory
 *   whose contents should be copied.
 * @param {string} dest - The absolute or relative path of the destination
 *   directory where the source contents should be written.
 *
 * @example
 * ```ts
 * // Copy "./templates/ts" to "./src/app/auth"
 * copyDirectory("./templates/ts", "./src/app/auth");
 * ```
 *
 * @example
 * ```ts
 * // Recursively clone a directory tree into a temporary location
 * const tmp = path.resolve(".tmp/scaffold");
 * copyDirectory("src/templates/ts", tmp);
 * ```
 */
export function copyDirectory(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
