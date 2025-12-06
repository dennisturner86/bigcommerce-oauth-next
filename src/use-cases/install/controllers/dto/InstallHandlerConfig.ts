import { InstallAppUseCase } from 'bigcommerce-oauth';

/**
 * Configuration object for constructing an {@link InstallController}.
 *
 * This configuration belongs to the interface-adapters layer and defines
 * how the controller should adapt an incoming Next.js request into a
 * call to the installation use case, and how the controller should respond
 * after the use case completes.
 *
 * The controller itself is responsible only for:
 * - extracting request parameters,
 * - invoking the {@link InstallAppUseCase},
 * - preparing a redirect response to a success or error view.
 */
export interface InstallHandlerConfig {
  /**
   * The use case responsible for performing the BigCommerce app installation.
   * The controller delegates all business logic to this use case.
   */
  installApp: InstallAppUseCase;

  /**
   * The redirect URI registered with BigCommerce for OAuth callbacks.
   * This value is forwarded to the installation use case to complete the
   * OAuth code exchange.
   */
  redirectUri: string;

  /**
   * The application-relative path to redirect the user to when installation
   * completes successfully. Defaults to "/auth/result".
   *
   * The controller will append query parameters describing the installation
   * result (e.g. `status=success` and `context=`).
   */
  successPath?: string;

  /**
   * The application-relative path to redirect the user to when installation
   * fails. Defaults to "/auth/result".
   *
   * The controller will append query parameters describing the reason for
   * failure (e.g. `status=error` and `code=`).
   */
  errorPath?: string;
}
