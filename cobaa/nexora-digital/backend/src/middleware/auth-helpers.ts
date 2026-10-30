import { User } from '@prisma/client';
import { createSession } from '../middleware/auth';

/** Wrapper: buat sesi server-side + token, format respons standar. */
export async function signTokenSafe(user: User) {
  const { token, expiresAt } = await createSession(user);
  return {
    token,
    expiresAt: expiresAt.toISOString(),
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}
