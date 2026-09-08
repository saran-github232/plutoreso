import argon2 from "argon2";

/**
 * Password hashing + verification (Phase 4 / Master Guide §37).
 *
 * Uses Argon2id — the OWASP-recommended memory-hard, side-channel-resistant
 * algorithm — suitable for Node.js production use. Hashing/verification
 * happens server-side only; hashes never leave the backend and are never
 * returned to the frontend.
 */

/**
 * Hash a plaintext password using Argon2id.
 * The returned string embeds algorithm, params, salt and hash, so it is safe
 * to store directly in `admins.password_hash`.
 */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

/**
 * Verify a plaintext password against a stored Argon2id hash.
 * Returns false on any mismatch or malformed hash instead of throwing, so a
 * login attempt cannot be distinguished by error shape (avoids
 * user-enumeration via exception timing).
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password meets minimum strength requirements.
 * Returns a structured result so callers can show actionable feedback.
 */
export function verifyPasswordStrength(plain: string): PasswordStrengthResult {
  const errors: string[] = [];

  if (plain.length < 8) errors.push("Password must be at least 8 characters.");
  if (plain.length > 128) errors.push("Password must not exceed 128 characters.");
  if (!/[A-Z]/.test(plain)) errors.push("Uppercase letter required.");
  if (!/[0-9]/.test(plain)) errors.push("At least one number required.");
  if (!/[^A-Za-z0-9]/.test(plain)) errors.push("At least one special character required.");

  return { valid: errors.length === 0, errors };
}
