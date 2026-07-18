'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MoreVertical, Pencil, Power, Search, Trash2 } from 'lucide-react';

import { Avatar, StatusBadge } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { deleteVehicleAction, setVehicleStatusAction } from '@/lib/actions/vehicle';
import type { VehicleStatus } from '@/types';

export interface VehicleListItem {
  id: string;
  name: string | null;
  model: string | null;
  registrationNumber: string;
  seatingCapacity: number;
  status: VehicleStatus;
  ownerName: string | null;
  ownerAvatar: string | null;
}

const PAGE_SIZE = 8;

export function VehiclesTable({ vehicles }: { vehicles: VehicleListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | VehicleStatus>('ALL');
  const [page, setPage] = useState(1);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<VehicleListItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      const matchesQuery =
        !q ||
        v.registrationNumber.toLowerCase().includes(q) ||
        (v.model ?? '').toLowerCase().includes(q) ||
        (v.name ?? '').toLowerCase().includes(q) ||
        (v.ownerName ?? '').toLowerCase().includes(q);
      const matchesStatus = status === 'ALL' || v.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [vehicles, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  async function toggleStatus(v: VehicleListItem) {
    setMenuFor(null);
    const next: VehicleStatus = v.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await setVehicleStatusAction(v.id, next);
    if (res.ok) {
      toast.success(res.message ?? 'Updated.');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search vehicle or driver…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as 'ALL' | VehicleStatus);
            setPage(1);
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">Status: All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table (desktop) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Registration</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Seats</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-mono font-semibold text-foreground">
                  {v.registrationNumber}
                </td>
                <td className="px-4 py-3 text-foreground">{v.name || v.model || '—'}</td>
                <td className="px-4 py-3 text-foreground">{v.seatingCapacity}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <Avatar src={v.ownerAvatar} name={v.ownerName} size={24} />
                    <span className="text-foreground">{v.ownerName || '—'}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={v.status} />
                </td>
                <td className="px-4 py-3">
                  <RowMenu
                    open={menuFor === v.id}
                    onOpenChange={(o) => setMenuFor(o ? v.id : null)}
                    vehicle={v}
                    onToggle={() => toggleStatus(v)}
                    onDelete={() => {
                      setMenuFor(null);
                      setToDelete(v);
                    }}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No vehicles match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="divide-y divide-border md:hidden">
        {rows.map((v) => (
          <div key={v.id} className="flex items-start justify-between gap-3 p-4">
            <div>
              <p className="font-mono font-semibold text-foreground">{v.registrationNumber}</p>
              <p className="text-sm text-foreground">{v.name || v.model || '—'}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {v.seatingCapacity} seats · {v.ownerName || '—'}
              </p>
              <div className="mt-2">
                <StatusBadge status={v.status} />
              </div>
            </div>
            <RowMenu
              open={menuFor === v.id}
              onOpenChange={(o) => setMenuFor(o ? v.id : null)}
              vehicle={v}
              onToggle={() => toggleStatus(v)}
              onDelete={() => {
                setMenuFor(null);
                setToDelete(v);
              }}
            />
          </div>
        ))}
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No vehicles match your search.
          </p>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
        <span>
          {filtered.length === 0
            ? '0 vehicles'
            : `Showing ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current <= 1}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current >= totalPages}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.registrationNumber}?`}
        description="This permanently removes the vehicle. If it's used by rides, deactivate it instead."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          const res = await deleteVehicleAction(toDelete.id);
          if (res.ok) {
            toast.success(res.message ?? 'Deleted.');
            router.refresh();
          } else {
            toast.error(res.error);
          }
          setToDelete(null);
        }}
      />
    </div>
  );
}

function RowMenu({
  open,
  onOpenChange,
  vehicle,
  onToggle,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleListItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => onOpenChange(!open)}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => onOpenChange(false)} />
          <div className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            <Link
              href={`/vehicles/${vehicle.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <button
              onClick={onToggle}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            >
              <Power className="h-4 w-4" />
              {vehicle.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={onDelete}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
