import { BigCommerceTokenExchangeError } from 'bigcommerce-oauth/gateways/BigCommerce';
import type { InstallAppUseCase } from 'bigcommerce-oauth/use-cases/install';
import { NextRequest, NextResponse } from 'next/server.js';
import type { InstallHandlerConfig } from './dto/InstallHandlerConfig.js';
import type { InstallResult } from './dto/InstallResult.js';
import { MissingOAuthParamsError } from './errors/MissingOAuthParamsError.js';

/**
 * Controller responsible for adapting an incoming BigCommerce installation
 * callback request into a call to the {@link InstallAppUseCase}, and for
 * producing the appropriate redirect response for Next.js.
 *
 * This class belongs to the **interface-adapters layer** and contains no
 * business logic. It:
 * - extracts and validates request parameters,
 * - invokes the installation use case,
 * - normalizes the result into a framework-agnostic DTO,
 * - builds a redirect response to a success or error route.
 *
 * Consumers should obtain a Next.js-compatible handler using the static
 * {@link InstallController.create} method.
 *
 * Subclasses may override protected methods to customize error mapping,
 * parameter extraction, or redirect behavior.
 */
export class InstallController {
  /**
   * The use case responsible for performing the BigCommerce installation
   * logic (OAuth exchange, store persistence, etc.).
   */
  protected readonly installApp: InstallAppUseCase;

  /**
   * The redirect URI registered with BigCommerce. Forwarded to the use case
   * as part of the OAuth code exchange parameters.
   */
  protected readonly redirectUri: string;

  /**
   * Application-relative path the controller redirects to after successful
   * installation. A `status=success` query parameter is always appended.
   */
  protected readonly successPath: string;

  /**
   * Application-relative path the controller redirects to when installation
   * fails. A `status=error` and an error code are appended as query params.
   */
  protected readonly errorPath: string;

  /**
   * Protected constructor ensures that controller instances are created only
   * through the factory method ({@link InstallController.create}) or by
   * subclasses. This enforces a controlled instantiation pattern.
   */
  protected constructor(config: InstallHandlerConfig) {
    this.installApp = config.installApp;
    this.redirectUri = config.redirectUri;
    this.successPath = config.successPath ?? '/auth/result';
    this.errorPath = config.errorPath ?? '/auth/result';
  }

  /**
   * Factory method that returns a Next.js-compatible handler function.
   *
   * This method:
   * - creates the controller instance,
   * - binds the `handle` method to preserve `this`,
   * - returns a function suitable for `export const GET = ...` in Next.js.
   *
   * @example
   * export const GET = InstallController.create({
   *   installApp,
   *   redirectUri: process.env.BIGCOMMERCE_REDIRECT_URI!,
   * });
   */
  static create(config: InstallHandlerConfig) {
    const controller = new InstallController(config);
    return controller.handle.bind(controller);
  }

  /**
   * Primary entrypoint used by Next.js for handling GET requests.
   *
   * The controller:
   * - executes the installation flow,
   * - determines whether it succeeded or failed,
   * - builds an appropriate redirect response.
   *
   * @param request Incoming Next.js request
   * @returns A {@link NextResponse} redirecting to success or error view
   */
  async handle(request: NextRequest): Promise<NextResponse> {
    const outcome = await this.performInstall(request);
    return this.buildRedirectResponse(request, outcome);
  }

  // ---------------------------------------------------------------------------
  // Protected helper methods — intended for subclass extension only
  // ---------------------------------------------------------------------------

  /**
   * Executes the installation use case and returns a normalized result object.
   * No framework-specific details are leaked to the use case.
   *
   * @param req Incoming request
   * @returns An {@link InstallResult} describing success or failure
   */
  protected async performInstall(req: NextRequest): Promise<InstallResult> {
    try {
      const params = this.getOAuthParams(req);

      await this.installApp.execute({ ...params, redirectUri: this.redirectUri }, {});

      return { status: 'success', context: params.context };
    } catch (err) {
      console.log(err);
      return { status: 'error', errorCode: this.mapErrorToCode(err) };
    }
  }

  /**
   * Extracts and validates OAuth parameters from the request.
   * Throws a {@link MissingOAuthParamsError} if required values are absent.
   *
   * @param req Incoming request
   * @returns Normalized OAuth parameters used by the use case
   */
  protected getOAuthParams(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code') ?? '';
    const context = url.searchParams.get('context') ?? '';
    const scope = url.searchParams.get('scope') ?? '';

    if (!code || !context) {
      throw new MissingOAuthParamsError();
    }

    return { code, context, scope };
  }

  /**
   * Maps internal or framework errors to stable string codes that can be
   * appended to the redirect URL or used to drive UI messaging. Designed to be
   * simple, predictable, and overrideable.
   *
   * @param err Any thrown error
   * @returns A short machine-friendly error string
   */
  protected mapErrorToCode(err: unknown): string {
    if (err instanceof MissingOAuthParamsError) return 'missing_params';
    if (err instanceof BigCommerceTokenExchangeError) return 'token_exchange_failed';
    return 'unknown';
  }

  /**
   * Determines the publicly accessible base URL for the incoming request.
   *
   * When the application is running behind a reverse proxy or tunneling service
   * (e.g., ngrok, Vercel, load balancers), Next.js will internally rewrite the
   * request URL to use the local development host (e.g., `localhost:3000`).
   *
   * BigCommerce, however, accesses the application through the *public* domain,
   * and redirect responses must use that domain to remain valid.
   *
   * This method reconstructs the correct external base URL by consulting
   * forwarded headers:
   *
   * - `x-forwarded-host`   → the public hostname forwarded by the proxy
   * - `x-forwarded-proto`  → the original protocol (`https` in production/ngrok)
   *
   * If forwarded headers are absent (e.g., local development without a proxy),
   * it falls back to `host` and a default `http` value.
   *
   * @param req Incoming Next.js request
   * @returns The fully qualified base URL representing the public-facing domain
   */
  protected getBaseUrl(req: NextRequest): string {
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000';

    const protocol = req.headers.get('x-forwarded-proto') ?? 'http';

    return `${protocol}://${host}`;
  }

  /**
   * Builds a redirect response pointing to the appropriate success or error view
   * based on the result of the installation process.
   *
   * This method:
   * - resolves the correct public-facing base URL using {@link getBaseUrl},
   *   ensuring redirect URLs remain valid when the app is behind ngrok or other proxies,
   * - selects either the configured `successPath` or `errorPath`,
   * - appends normalized installation outcome data as query parameters.
   *
   * The generated redirect URL is fully qualified and safe for use by external
   * clients such as the BigCommerce control panel, which requires absolute URLs.
   *
   * @param request The original incoming Next.js request
   * @param outcome The normalized result of executing the installation flow
   * @returns A {@link NextResponse} containing an absolute redirect URL
   */
  protected buildRedirectResponse(request: NextRequest, outcome: InstallResult) {
    const baseUrl = this.getBaseUrl(request);
    const targetPath = outcome.status === 'success' ? this.successPath : this.errorPath;

    const search = new URLSearchParams({
      status: outcome.status,
      ...(outcome.context ? { context: outcome.context } : {}),
      ...(outcome.errorCode ? { code: outcome.errorCode } : {}),
    });

    return NextResponse.redirect(new URL(`${targetPath}?${search.toString()}`, baseUrl));
  }
}
