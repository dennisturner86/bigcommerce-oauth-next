/**
 * Represents the normalized query parameters passed to the installation
 * result page after the OAuth installation flow completes.
 *
 * These values are appended to the redirect URL by the {@link InstallController}
 * and consumed by the server component (`page.tsx`) before being forwarded to
 * the `AuthResult` presenter.
 */
export type SearchParams = {
  /**
   * High-level result of the installation flow: `"success"` or `"error"`.
   * Defaults to `"success"` when omitted.
   */
  status?: 'success' | 'error';

  /**
   * Optional error identifier describing the installation failure.
   * Present only when `status` is `"error"`.
   */
  code?: string;

  /**
   * Optional BigCommerce store context returned by the OAuth callback,
   * typically in the format `"stores/{storeHash}"`.
   * Provided only when installation succeeds.
   */
  context?: string;
};
