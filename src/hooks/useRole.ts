import { Role } from '../types';

/** Gift Desk volunteers and contributors may correct their own gift only within this window (matches firestore.rules). */
export const GIFT_EDIT_WINDOW_MS = 15 * 60 * 1000;

type TimestampLike = { toDate: () => Date } | Date | number | null | undefined;

function toMillis(value: TimestampLike): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof (value as { toDate?: unknown }).toDate === 'function')
    return (value as { toDate: () => Date }).toDate().getTime();
  return null;
}

export function can(
  role: Role | undefined,
  capability: string,
  context?: { createdBy?: string; myUid?: string; createdAt?: TimestampLike; now?: number }
): boolean {
  if (!role) return false;

  switch (capability) {
    case 'view_dashboard':
      return ['owner', 'editor', 'contributor', 'viewer'].includes(role);

    case 'add_expense':
      return ['owner', 'editor', 'contributor'].includes(role);

    case 'edit_expense':
      if (['owner', 'editor'].includes(role)) return true;
      if (role === 'contributor' && context?.createdBy && context?.myUid) {
        return context.createdBy === context.myUid;
      }
      return false;

    case 'manage_vendors':
      return ['owner', 'editor'].includes(role);

    case 'add_gift':
      return ['owner', 'editor', 'contributor', 'giftDesk'].includes(role);

    case 'view_all_gifts':
      return ['owner', 'editor', 'contributor', 'viewer'].includes(role);

    case 'edit_gift':
      if (['owner', 'editor'].includes(role)) return true;
      if (['giftDesk', 'contributor'].includes(role) && context?.createdBy && context?.myUid) {
        if (context.createdBy !== context.myUid) return false;
        const created = toMillis(context.createdAt);
        // A just-saved gift (still syncing) has no server time yet — allow the fix.
        if (created === null) return true;
        return (context.now ?? Date.now()) - created < GIFT_EDIT_WINDOW_MS;
      }
      return false;

    case 'manage_members':
      return role === 'owner';

    case 'edit_budget':
      return ['owner', 'editor'].includes(role);

    case 'export_reports':
      return ['owner', 'editor'].includes(role);

    case 'view_documents':
      return ['owner', 'editor'].includes(role);

    default:
      return false;
  }
}
