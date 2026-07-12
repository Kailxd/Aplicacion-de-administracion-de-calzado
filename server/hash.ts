import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Genera un hash seguro para la contraseña usando PBKDF2 con sal y SHA256.
 * El formato es 'sal:hash' (aproximadamente 81 caracteres de longitud).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(8).toString('hex'); // 16 caracteres hex
  const hash = pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex'); // 64 caracteres hex
  return `${salt}:${hash}`;
}

/**
 * Compara una contraseña en texto plano contra su hash guardado.
 * Soporta texto plano heredado si el hash no contiene dos puntos ':'.
 */
export function verifyPassword(password: string, hash: string): boolean {
  if (!hash || !hash.includes(':')) {
    return password === hash;
  }
  const [salt, storedHash] = hash.split(':');
  const hashBuffer = Buffer.from(storedHash, 'hex');
  const verifyBuffer = pbkdf2Sync(password, salt, 1000, 32, 'sha256');
  return timingSafeEqual(hashBuffer, verifyBuffer);
}
