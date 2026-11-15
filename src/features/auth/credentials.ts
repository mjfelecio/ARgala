import { z } from 'zod';

// Existing account passwords are submitted exactly, including whitespace.
export const signInSchema = z.object({ email: z.string().trim().pipe(z.email()), password: z.string().min(1) });
