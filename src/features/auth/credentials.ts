import { z } from 'zod';
export const signInSchema = z.object({ email: z.string().trim().pipe(z.email()), password: z.string().min(1) });
// Trim before validating email; passwords must retain their exact contents.
const email = z.string().trim().pipe(z.email());
export const registrationSchema = z.object({ email, password: z.string().min(8).max(128) });
