import type { InstallHandlerConfig } from '@/use-cases/install/controllers/dto/InstallHandlerConfig.js';
import { InstallController } from '@/use-cases/install/controllers/InstallController.js';
import { BigCommerceTokenExchangeError } from 'bigcommerce-oauth/gateways/BigCommerce';
import type { InstallAppUseCase } from 'bigcommerce-oauth/use-cases/install';
import { describe, expect, it, vi } from 'vitest';

const redirectUri = 'https://my-app.example.com/api/bc/install/callback';

function createInstallAppMock() {
  const execute = vi.fn().mockResolvedValue({} as any);
  const installApp = { execute } as unknown as InstallAppUseCase;
  return { installApp, execute };
}

function createRequest(url: string, headersInit: Record<string, string> = {}) {
  const headers = new Headers(headersInit);
  // Minimal NextRequest-like shape; controller only uses url + headers
  return { url, headers } as any;
}

// Test-only subclass to expose protected methods
class TestableInstallController extends InstallController {
  constructor(config: InstallHandlerConfig) {
    // protected in base, but callable from subclass
    super(config);
  }

  public getBaseUrlPublic(req: any): string {
    // call the protected method from subclass
    return this.getBaseUrl(req as any);
  }
}

describe('InstallController', () => {
  it('calls installApp with correct params and redirects to successPath', async () => {
    const { installApp, execute } = createInstallAppMock();

    const handler = InstallController.create({
      installApp,
      redirectUri,
      // use defaults for successPath/errorPath
    });

    const req = createRequest(
      'https://internal.example.com/api/bc/install?code=abc123&context=stores/xyz&scope=store_v2_products',
      {
        'x-forwarded-host': 'public.example.com',
        'x-forwarded-proto': 'https',
      },
    );

    const res = await handler(req);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();

    const redirectUrl = new URL(location!);

    expect(redirectUrl.origin).toBe('https://public.example.com');
    expect(redirectUrl.pathname).toBe('/auth/result');
    expect(redirectUrl.searchParams.get('status')).toBe('success');
    expect(redirectUrl.searchParams.get('context')).toBe('stores/xyz');
    expect(redirectUrl.searchParams.get('code')).toBeNull();

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      {
        code: 'abc123',
        context: 'stores/xyz',
        scope: 'store_v2_products',
        redirectUri,
      },
      {},
    );
  });

  it('redirects to errorPath with missing_params when code/context are missing', async () => {
    const { installApp, execute } = createInstallAppMock();

    const handler = InstallController.create({
      installApp,
      redirectUri,
      successPath: '/custom/success',
      errorPath: '/custom/error',
    });

    // Missing both code and context
    const req = createRequest(
      'https://internal.example.com/api/bc/install?scope=store_v2_products',
      {
        host: 'shop.example.com',
      },
    );

    const res = await handler(req);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();

    const redirectUrl = new URL(location!);

    expect(redirectUrl.origin).toBe('http://shop.example.com'); // falls back to host + default http
    expect(redirectUrl.pathname).toBe('/custom/error');
    expect(redirectUrl.searchParams.get('status')).toBe('error');
    expect(redirectUrl.searchParams.get('code')).toBe('missing_params');
    expect(redirectUrl.searchParams.get('context')).toBeNull();

    // Use case should never be called if params are invalid
    expect(execute).not.toHaveBeenCalled();
  });

  it('passes an empty scope string when scope query param is missing', async () => {
    const { installApp, execute } = createInstallAppMock();

    const handler = InstallController.create({
      installApp,
      redirectUri,
    });

    const req = createRequest(
      // note: NO `scope` in the query string
      'https://internal.example.com/api/bc/install?code=abc123&context=stores/xyz',
      {
        'x-forwarded-host': 'public.example.com',
        'x-forwarded-proto': 'https',
      },
    );

    const res = await handler(req);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();

    const redirectUrl = new URL(location!);

    // still a success redirect
    expect(redirectUrl.searchParams.get('status')).toBe('success');

    // verify the use case was called with scope === ''
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      {
        code: 'abc123',
        context: 'stores/xyz',
        scope: '',
        redirectUri,
      },
      {},
    );
  });

  it('maps BigCommerceTokenExchangeError to token_exchange_failed', async () => {
    const execute = vi.fn().mockRejectedValue(
      // Create an object with BigCommerceTokenExchangeError prototype
      Object.create(BigCommerceTokenExchangeError.prototype),
    );
    const installApp = { execute } as unknown as InstallAppUseCase;

    const handler = InstallController.create({
      installApp,
      redirectUri,
    });

    const req = createRequest(
      'https://internal.example.com/api/bc/install?code=abc123&context=stores/xyz&scope=store_v2_products',
      {
        'x-forwarded-host': 'public.example.com',
        'x-forwarded-proto': 'https',
      },
    );

    const res = await handler(req);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();

    const redirectUrl = new URL(location!);

    expect(redirectUrl.pathname).toBe('/auth/result');
    expect(redirectUrl.searchParams.get('status')).toBe('error');
    expect(redirectUrl.searchParams.get('code')).toBe('token_exchange_failed');
  });

  it('falls back to "unknown" error code for unexpected errors', async () => {
    const execute = vi.fn().mockRejectedValue(new Error('boom'));
    const installApp = { execute } as unknown as InstallAppUseCase;

    const handler = InstallController.create({
      installApp,
      redirectUri,
    });

    const req = createRequest(
      'https://internal.example.com/api/bc/install?code=abc123&context=stores/xyz&scope=store_v2_products',
      {
        host: 'shop.example.com',
      },
    );

    const res = await handler(req);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();

    const redirectUrl = new URL(location!);

    expect(redirectUrl.pathname).toBe('/auth/result');
    expect(redirectUrl.searchParams.get('status')).toBe('error');
    expect(redirectUrl.searchParams.get('code')).toBe('unknown');
  });

  it('getBaseUrl falls back to http://localhost:3000 when no headers are present', () => {
    const { installApp } = createInstallAppMock();

    const controller = new TestableInstallController({
      installApp,
      redirectUri,
    });

    const req = createRequest(
      'https://internal.example.com/api/bc/install?code=abc123&context=stores/xyz',
      {}, // no x-forwarded-host, no host
    );

    const baseUrl = controller.getBaseUrlPublic(req);

    expect(baseUrl).toBe('http://localhost:3000');
  });
});
