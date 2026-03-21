/**
 * Lightweight credential helpers for the demo.
 * NOTE: btoa/atob is NOT secure hashing – use bcrypt in production.
 */

export function hashPassword(plain: string): string {
  return btoa(plain + '__salt__taskmaster__2025');
}

export function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
