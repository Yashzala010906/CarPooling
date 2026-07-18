'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Copy, LogOut, Trash2 } from 'lucide-react';

import { Avatar, RoleBadge } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  leaveCompanyAction,
  removeMemberAction,
  updateMemberRoleAction,
} from '@/lib/actions/company';
import type { CompanyRole } from '@/types';

/* Copy join code ---------------------------------------------------------- */
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success('Code copied');
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-sm font-semibold tracking-widest hover:bg-accent"
    >
      {code}
      {copied ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

/* Leave company ----------------------------------------------------------- */
export function LeaveCompanyButton({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" /> Leave Company
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Leave this company?"
        description="You'll lose access to its members and vehicles. You can re-join later with the code."
        confirmLabel="Leave"
        destructive
        onConfirm={async () => {
          const res = await leaveCompanyAction(companyId);
          if (res.ok) {
            toast.success(res.message ?? 'Left company.');
            router.push('/company');
            router.refresh();
          } else {
            toast.error(res.error);
          }
        }}
      />
    </>
  );
}

/* Member management (managers only) --------------------------------------- */
export interface MemberRow {
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  role: CompanyRole;
}

export function MemberManager({
  companyId,
  members,
  callerRole,
  currentUserId,
}: {
  companyId: string;
  members: MemberRow[];
  callerRole: CompanyRole;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toRemove, setToRemove] = useState<MemberRow | null>(null);
  const isOwner = callerRole === 'OWNER';
  const isManager = callerRole === 'OWNER' || callerRole === 'ADMIN';

  function changeRole(userId: string, role: CompanyRole) {
    startTransition(async () => {
      const res = await updateMemberRoleAction(companyId, userId, role);
      if (res.ok) {
        toast.success(res.message ?? 'Updated.');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {members.map((m) => {
          const isSelf = m.userId === currentUserId;
          const canEditRole = isOwner && m.role !== 'OWNER' && !isSelf;
          const canRemove = isManager && m.role !== 'OWNER' && !isSelf;
          return (
            <li key={m.userId} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={m.avatarUrl} name={m.name} size={36} />
                <span className="truncate text-sm font-medium text-foreground">
                  {m.name || 'Unnamed'}{' '}
                  {isSelf && <span className="text-muted-foreground">(you)</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canEditRole ? (
                  <select
                    value={m.role}
                    disabled={pending}
                    onChange={(e) => changeRole(m.userId, e.target.value as CompanyRole)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                ) : (
                  <RoleBadge role={m.role} />
                )}
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => setToRemove(m)}
                    disabled={pending}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        title={`Remove ${toRemove?.name || 'this member'}?`}
        description="They'll lose access to this company immediately."
        confirmLabel="Remove"
        destructive
        onConfirm={async () => {
          if (!toRemove) return;
          const res = await removeMemberAction(companyId, toRemove.userId);
          if (res.ok) {
            toast.success(res.message ?? 'Removed.');
            router.refresh();
          } else {
            toast.error(res.error);
          }
          setToRemove(null);
        }}
      />
    </>
  );
}
