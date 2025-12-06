/**
 * Props passed to the {@link AuthResult} client component, representing the
 * outcome of the app installation flow as interpreted on the frontend.
 *
 * These values are derived from query parameters appended by the
 * {@link InstallController} after completing the OAuth installation process.
 */
export type AuthResultProps = {
  /**
   * High-level result of the installation process.
   *
   * `"success"` — Installation completed without errors.
   * `"error"` — A validation or OAuth problem occurred.
   */
  status?: 'success' | 'error';

  /**
   * Optional machine-readable error identifier describing why installation
   * failed. Present only when `status` is `"error"`.
   */
  code?: string;

  /**
   * Optional BigCommerce store context returned during OAuth
   * (e.g., `"stores/yt49yev1ez"`). Provided on successful installation.
   */
  context?: string;
};
