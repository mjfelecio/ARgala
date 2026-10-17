import { expect, it } from 'vitest';
import { registrationSchema, signInSchema } from './credentials';
it('rejects invalid emails and empty sign-in passwords', () => {
  expect(signInSchema.safeParse({ email: 'bad', password: 'password' }).success).toBe(false);
  expect(signInSchema.safeParse({ email: 'test@example.com', password: '' }).success).toBe(false);
});
it('allows existing short passwords for sign-in but requires eight characters for registration', () => {
  const input = { email: 'test@example.com', password: '123456' };
  expect(signInSchema.safeParse(input).success).toBe(true);
  expect(registrationSchema.safeParse(input).success).toBe(false);
});
it('trims email without changing passwords', () => {
  expect(signInSchema.parse({ email: ' test@example.com ', password: ' password ' })).toEqual({ email: 'test@example.com', password: ' password ' });
});
