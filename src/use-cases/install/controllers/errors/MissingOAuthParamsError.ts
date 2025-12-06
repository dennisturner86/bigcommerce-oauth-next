/**
 * Thrown when mandatory query parameters (`code`, `context`) are absent from
 * a BigCommerce OAuth callback.
 *
 * Controllers catch this and map it to **400 Bad Request**.
 */
export class MissingOAuthParamsError extends Error {
  constructor() {
    super('Missing OAuth parameters: `code` and `context` are required.');
  }
}
