import { InstallStatus } from './InstallStatus.js';

/**
 * Represents the normalized outcome of an installation request handled by
 * the {@link InstallController}. This DTO is used exclusively within the
 * interface-adapters layer to drive redirect logic after executing the
 * installation use case.
 */
export interface InstallResult {
  /**
   * High-level status of the installation process.
   *
   * - `"success"` — The installation completed without errors.
   * - `"error"` — A validation or OAuth-related error occurred.
   */
  status: InstallStatus;

  /**
   * Optional BigCommerce store context (e.g., `"stores/abc"`).
   *
   * This is included only on successful installs and may be forwarded to
   * the UI layer to support additional configuration or onboarding logic.
   */
  context?: string;

  /**
   * Optional machine-friendly identifier describing why the installation
   * failed (e.g., `"missing_params"`, `"token_exchange_failed"`).
   *
   * This is provided only when `status` is `"error"` and is intended for
   * routing decisions, logging, or mapping to human-readable messages in
   * the UI layer.
   */
  errorCode?: string;
}
