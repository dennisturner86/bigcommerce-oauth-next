import { InstallController } from 'bigcommerce-oauth-next';
import { installApp } from './_composition/installApp';

const { BIGCOMMERCE_REDIRECT_URI = '' } = process.env;

/**
 * Next.js route entrypoint for handling the `/auth` installation callback
 * from BigCommerce.
 *
 * This file belongs to the **framework layer** and contains no business logic.
 * Its sole responsibility is to:
 *
 * - read environment configuration,
 * - instantiate an {@link InstallController} using the pre-assembled
 *   `installApp` use case,
 * - expose a Next.js-compatible `GET` handler.
 *
 * The controller adapts the request into a use-case invocation and produces
 * an appropriate redirect response based on the installation outcome.
 *
 * @see InstallController
 * @see installApp
 */
export const GET = InstallController.create({
  installApp,
  redirectUri: BIGCOMMERCE_REDIRECT_URI,
});
