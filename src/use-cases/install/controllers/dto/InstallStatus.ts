/**
 * Represents the high-level outcome of handling an installation request.
 *
 * This status is used by the {@link InstallController} to determine whether
 * the user should be redirected to a success or error view after executing
 * the installation use case.
 *
 * It intentionally expresses only two states:
 * - `"success"` — the installation flow completed without errors.
 * - `"error"` — an error occurred during validation or OAuth code exchange.
 *
 * More detailed information (e.g., specific error codes) is carried separately
 * in the {@link InstallResult} DTO.
 */
export type InstallStatus = 'success' | 'error';
