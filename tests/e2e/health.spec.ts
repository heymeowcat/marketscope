import { test, expect } from '@playwright/test';

test.describe('MarketScope E2E & Health Verification', () => {
  test('NFR-07: /health endpoint returns HTTP 200 within 1 second', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/health');
    const elapsed = Date.now() - start;

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(elapsed).toBeLessThan(1000);
  });

  test('/api/health endpoint returns HTTP 200 with status ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});
