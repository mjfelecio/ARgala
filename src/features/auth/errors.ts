import { isAuthError } from '@supabase/supabase-js';

export function authErrorMessageKey(error: unknown, fallback: 'auth.failed' | 'auth.logoutFailed' = 'auth.failed') {
  if (!isAuthError(error)) return fallback;
  switch (error.code) {
    case 'invalid_credentials': return 'auth.invalidCredentials';
    case 'email_not_confirmed': return 'auth.emailNotConfirmed';
    case 'weak_password': return 'auth.weakPassword';
    case 'email_exists':
    case 'user_already_exists': return 'auth.accountExists';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit': return 'auth.rateLimited';
    default: return fallback;
  }
}
