import { BigCommerceOAuthClient } from 'bigcommerce-oauth/gateways/BigCommerce';
import type { InstallAppUseCase } from 'bigcommerce-oauth/use-cases/install';
import { InstallApp } from 'bigcommerce-oauth/use-cases/install';

const { BIGCOMMERCE_CLIENT_ID, BIGCOMMERCE_CLIENT_SECRET } = process.env;

/**
 * Composition root for the installation feature.
 *
 * This file belongs to the **framework layer** and is responsible for
 * constructing the concrete dependencies required by the installation
 * use case. No business logic should exist here — only wiring.
 *
 * Responsibilities:
 * - Instantiate the BigCommerce OAuth gateway,
 * - Create the `InstallApp` use case,
 * - Apply optional decorators (e.g., persistence, analytics, auditing),
 * - Export a fully assembled `InstallAppUseCase` ready for the controller.
 *
 * This keeps the use case completely framework-agnostic and ensures that the
 * controller receives a fully configured dependency.
 */

// Concrete OAuth gateway used by the installation use case.
const oauthClient = new BigCommerceOAuthClient(
  BIGCOMMERCE_CLIENT_ID || '',
  BIGCOMMERCE_CLIENT_SECRET || '',
);

// Example of optional repository + decorator wiring:
//
// const storeRepo = new SupabaseStoreRepository();
// let installApp: InstallAppUseCase = new InstallApp(oauthClient);
// installApp = new UpsertStoreFromSession(installApp, storeRepo);

/**
 * Fully constructed installation use case instance.
 * Exported for consumption by the InstallController.
 */
const installApp: InstallAppUseCase = new InstallApp(oauthClient);

export { installApp };
