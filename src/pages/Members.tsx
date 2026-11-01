import { errorMessage } from '../lib/errors';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserPlus, Share2, Copy, Check, Trash2, KeyRound } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BottomSheet } from '../components/ui/BottomSheet';
import { createInvite } from '../services/invites';
import { removeMember } from '../services/members';
import { Role, Side } from '../types';

export const Members: React.FC = () => {
  const { t } = useTranslation();
  const { weddingId, wedding, members, myMembership, showToast } = useWedding();
  const { user, profile } = useAuth();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<Role>('editor');
  const [inviteSide, setInviteSide] = useState<Side>('common');
  const [generatedInvite, setGeneratedInvite] = useState<{ code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwner = myMembership?.role === 'owner';

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weddingId || !user) return;

    setLoading(true);
    try {
      const invite = await createInvite(
        weddingId,
        wedding?.title || 'Wedding',
        inviteRole,
        inviteSide,
        user.uid,
        profile?.displayName || user.displayName || 'Owner'
      );
      setGeneratedInvite({ code: invite.code });
      showToast('Invite code generated!');
    } catch (err) {
      showToast(errorMessage(err, 'Failed to create invite'));
    } finally {
      setLoading(false);
    }
  };

  const shareText = `Namaste! Join our family wedding ledger "${wedding?.title || 'Vivah Khata'}" on Vivah Khata.
Invite Code: ${generatedInvite?.code}
Open app: ${window.location.origin}/join/${generatedInvite?.code}`;

  const handleCopy = () => {
    if (!generatedInvite) return;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    showToast('Invite message copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleRemove = async (targetUid: string, memberName: string) => {
    if (!weddingId) return;
    if (window.confirm(`Are you sure you want to remove ${memberName} from this wedding ledger?`)) {
      try {
        await removeMember(weddingId, targetUid);
        showToast(`${memberName} removed from ledger`);
      } catch (err) {
        showToast(errorMessage(err, 'Failed to remove member'));
      }
    }
  };

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'owner':
        return 'primary';
      case 'editor':
        return 'accent';
      case 'giftDesk':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header with Invite Button */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif-wedding text-[var(--color-text)]">
              {t('members.title')}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {members.length} family members connected
            </p>
          </div>
        </div>

        {isOwner && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setGeneratedInvite(null);
              setIsInviteModalOpen(true);
            }}
            icon={<UserPlus className="w-4 h-4" />}
          >
            {t('members.invite_btn')}
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xs divide-y divide-[var(--color-border)] overflow-hidden">
        {members.map((member) => {
          const isMe = member.uid === user?.uid;
          return (
            <div
              key={member.uid}
              className="p-4 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={member.displayName} photoURL={member.photoURL} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--color-text)] truncate">
                      {member.displayName}
                    </span>
                    {isMe && (
                      <span className="text-[11px] font-bold text-[var(--color-primary)]">
                        ({t('members.you')})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] capitalize mt-0.5">
                    {member.side} side
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={getRoleBadgeVariant(member.role)} size="sm">
                  {member.role}
                </Badge>

                {isOwner && !isMe && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member.uid, member.displayName)}
                    className="p-1.5 text-neutral-400 hover:text-[var(--color-danger)] cursor-pointer"
                    aria-label={`Remove ${member.displayName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Family Modal */}
      <BottomSheet
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Family Member"
      >
        {!generatedInvite ? (
          <form onSubmit={handleCreateInvite} className="flex flex-col gap-4 pb-6">
            <p className="text-xs text-[var(--color-text-muted)]">
              Choose the role and family side for the invite link. Codes are valid for 7 days.
            </p>

            {/* Role Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Access Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'editor',
                    title: 'Editor',
                    desc: 'Add & edit expenses, vendors, gifts',
                  },
                  {
                    id: 'contributor',
                    title: 'Contributor',
                    desc: 'Log expenses they paid themselves',
                  },
                  {
                    id: 'giftDesk',
                    title: 'Gift Desk',
                    desc: 'Venue desk volunteer for gifts only',
                  },
                  {
                    id: 'viewer',
                    title: 'Viewer',
                    desc: 'Read-only view for elders',
                  },
                ].map((r) => {
                  const isSelected = inviteRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setInviteRole(r.id as Role)}
                      className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)] font-bold'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                      }`}
                    >
                      <span className="text-sm font-bold text-[var(--color-text)] block">
                        {r.title}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)] font-normal block mt-0.5">
                        {r.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Side Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Family Side
              </label>
              <select
                value={inviteSide}
                onChange={(e) => setInviteSide(e.target.value as Side)}
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl"
              >
                <option value="common">Common (Both sides)</option>
                <option value="bride">{wedding?.sides?.bride?.label || 'Bride Side'}</option>
                <option value="groom">{wedding?.sides?.groom?.label || 'Groom Side'}</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={<KeyRound className="w-5 h-5" />}
            >
              Generate 6-Char Code
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-5 text-center py-4 pb-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Share2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                Shareable 6-Character Code
              </span>
              <span className="text-4xl font-mono font-bold tracking-widest text-[var(--color-primary)] block py-2 select-all">
                {generatedInvite.code}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                Role: <span className="font-bold capitalize">{inviteRole}</span> • Side:{' '}
                <span className="font-bold capitalize">{inviteSide}</span>
              </span>
            </div>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-95 shadow-md cursor-pointer transition-all active:scale-98"
            >
              <Share2 className="w-5 h-5" />
              <span>{t('members.whatsapp_share')}</span>
            </button>

            {/* Copy Message */}
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={handleCopy}
              icon={
                copied ? (
                  <Check className="w-4 h-4 text-[var(--color-success)]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )
              }
            >
              {copied ? 'Copied to Clipboard ✓' : t('members.copy_link')}
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};
