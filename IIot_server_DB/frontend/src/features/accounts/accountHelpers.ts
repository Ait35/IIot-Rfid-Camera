export type AccountRole = 'admin' | 'teacher' | 'dev';

export const ROLE_OPTIONS: Array<{ value: AccountRole; label: string; privileged?: boolean }> = [
  { value: 'admin', label: 'admin (ผู้ดูแลทั่วไป)' },
  { value: 'teacher', label: 'teacher (อาจารย์)', privileged: true },
  { value: 'dev', label: 'dev (ผู้พัฒนาระบบ)', privileged: true },
];

export const ROLE_BADGE_MAP: Record<string, { className: string; label: string }> = {
  dev: { className: 'badge badge-pink', label: 'dev' },
  teacher: { className: 'badge badge-pending', label: 'teacher' },
  admin: { className: 'badge badge-active', label: 'admin' },
};

/** Checks whether the role is Teacher or Dev (privileged administrator). */
export function isPrivilegedRole(role?: string | null): boolean {
  return role === 'dev' || role === 'teacher';
}

/** Normalizes any role string to a valid editable `AccountRole`. */
export function normalizeAccountRole(role?: string | null): AccountRole {
  if (role === 'dev' || role === 'teacher') return role;
  return 'admin';
}

/** Checks whether an actor with `actorRole` may edit or delete `targetRole`. */
export function canModifyAccount(actorRole: string, targetRole?: string | null): boolean {
  if (isPrivilegedRole(actorRole)) return true;
  if (actorRole === 'admin') {
    return !isPrivilegedRole(targetRole);
  }
  return false;
}
