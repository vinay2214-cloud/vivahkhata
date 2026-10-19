import { Role } from '../types';

export function can(role: Role | undefined, capability: string, context?: { createdBy?: string; myUid?: string; createdAt?: any }): boolean {
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
        return context.createdBy === context.myUid;
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
