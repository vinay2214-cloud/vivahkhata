import { describe, expect, it } from 'vitest';
import { can, GIFT_EDIT_WINDOW_MS } from '../src/hooks/useRole';

describe('role permissions (mirror firestore.rules)', () => {
  it('lets only owner, editor and contributor add expenses', () => {
    expect(can('owner', 'add_expense')).toBe(true);
    expect(can('editor', 'add_expense')).toBe(true);
    expect(can('contributor', 'add_expense')).toBe(true);
    expect(can('giftDesk', 'add_expense')).toBe(false);
    expect(can('viewer', 'add_expense')).toBe(false);
    expect(can(undefined, 'add_expense')).toBe(false);
  });

  it('lets a contributor edit only their own expenses', () => {
    expect(can('contributor', 'edit_expense', { createdBy: 'u1', myUid: 'u1' })).toBe(true);
    expect(can('contributor', 'edit_expense', { createdBy: 'u2', myUid: 'u1' })).toBe(false);
    expect(can('editor', 'edit_expense', { createdBy: 'u2', myUid: 'u1' })).toBe(true);
  });

  it('hides gifts from the Gift Desk role and keeps members owner-only', () => {
    expect(can('giftDesk', 'view_all_gifts')).toBe(false);
    expect(can('giftDesk', 'add_gift')).toBe(true);
    expect(can('editor', 'manage_members')).toBe(false);
    expect(can('owner', 'manage_members')).toBe(true);
  });

  it('keeps the documents vault for owner and editor only', () => {
    expect(can('contributor', 'view_documents')).toBe(false);
    expect(can('editor', 'view_documents')).toBe(true);
  });

  it('allows Gift Desk to fix their own gift only within 15 minutes', () => {
    const now = Date.parse('2026-11-22T10:00:00Z');
    const own = { createdBy: 'u1', myUid: 'u1', now };
    expect(can('giftDesk', 'edit_gift', { ...own, createdAt: new Date(now - 5 * 60 * 1000) })).toBe(true);
    expect(can('giftDesk', 'edit_gift', { ...own, createdAt: new Date(now - GIFT_EDIT_WINDOW_MS - 1) })).toBe(false);
    expect(can('giftDesk', 'edit_gift', { ...own, createdAt: { toDate: () => new Date(now - 60_000) } })).toBe(true);
    expect(can('giftDesk', 'edit_gift', { ...own, createdAt: null })).toBe(true); // still syncing
    expect(can('giftDesk', 'edit_gift', { createdBy: 'u2', myUid: 'u1', now, createdAt: new Date(now) })).toBe(false);
    expect(can('owner', 'edit_gift', { createdBy: 'u2', myUid: 'u1' })).toBe(true);
  });

  it('denies unknown capabilities', () => {
    expect(can('owner', 'delete_everything')).toBe(false);
  });
});
