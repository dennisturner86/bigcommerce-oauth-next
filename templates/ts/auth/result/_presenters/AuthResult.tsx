'use client';

import { Box, H1, Panel, Text } from '@bigcommerce/big-design';
import type { AuthResultProps } from './_dto/AuthResultProps';

/**
 * Client-side presenter for displaying the result of the BigCommerce app
 * installation process. Renders either a success or error view based on the
 * normalized installation status passed from the server.
 *
 * When `adminAppUrl` is provided, the component also enables navigation to the
 * app inside the BigCommerce control panel by safely redirecting the top frame.
 */
export function AuthResult({ status = 'success', code }: AuthResultProps) {
  const isSuccess = status === 'success';

  return (
    <Box padding="xxLarge">
      <Panel>
        {isSuccess ? (
          <>
            <H1 marginBottom="medium">My App Installed 🎉</H1>

            <Text marginBottom="large">The app is now connected to this BigCommerce store.</Text>

            <Text marginBottom="medium">
              You&apos;re all set! You can now open <strong>Apps → My App</strong> from the
              BigCommerce control panel to configure your settings and start using the app.
            </Text>
          </>
        ) : (
          <>
            <H1 marginBottom="medium">Installation Failed 😕</H1>

            <Text marginBottom="medium">Something went wrong during the installation process.</Text>

            {code && (
              <Text marginBottom="medium">
                <strong>Error code:</strong> {code}
              </Text>
            )}

            <Text marginBottom="large">
              Please try installing the app again. If the issue persists, contact support and
              provide the error code above.
            </Text>
          </>
        )}
      </Panel>
    </Box>
  );
}
