import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './env';

describe('client environment', () => {
  it('returns a setup state when required values are missing', () => {
    expect(validateEnvironment({}).success).toBe(false);
  });
  it('rejects non-HTTPS Supabase URLs and server secret keys', () => {
    expect(validateEnvironment({ url: 'http://example.com', key: 'sb_secret_private' }).success).toBe(false);
  });
  it('accepts public publishable keys', () => {
    expect(validateEnvironment({ url: 'https://example.supabase.co', key: 'sb_publishable_example' }).success).toBe(true);
  });
});
