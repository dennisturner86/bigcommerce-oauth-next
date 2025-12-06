import type { SearchParams } from './_dto/SearchParams';
import { AuthResult } from './_presenters/AuthResult';

/**
 * Server component responsible for preparing the data required by the
 * {@link AuthResult} presenter based on the query parameters appended by the
 * {@link InstallController} after completing the BigCommerce installation
 * callback.
 *
 * In Next.js 15+, `searchParams` is delivered to server components as a
 * `Promise`, so this function awaits the resolved parameters before computing
 * additional derived values.
 *
 * Responsibilities:
 * - Resolve the `searchParams` Promise provided by Next.js.
 * - Extract installation status, error code, and store context.
 * - Derive the absolute BigCommerce admin URL (`adminAppUrl`) when the
 *   installation succeeds. This URL is constructed using:
 *     - the store hash from the OAuth `context` parameter, and
 *     - the application ID configured in the environment.
 * - Delegate UI rendering to the `AuthResult` client presenter.
 *
 * This component intentionally contains no business logic. It serves as a
 * translation layer between controller-generated query parameters and the
 * props required by the client-facing installation result screen.
 *
 * @param searchParams - A Promise resolving to the normalized installation
 *   result parameters extracted from the URL query string.
 */
export default async function AuthResultPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const { status, code, context } = resolved;

  return <AuthResult status={status} code={code} context={context} />;
}
