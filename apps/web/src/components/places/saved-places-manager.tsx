'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Bookmark, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@carpool/ui';

import { SubmitButton, TextField } from '@/components/ui/form';
import { EmptyState } from '@/components/ui/primitives';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  createSavedPlaceAction,
  deleteSavedPlaceAction,
  updateSavedPlaceAction,
} from '@/lib/actions/saved-places';
import { savedPlaceSchema, type SavedPlaceInput } from '@/lib/validations';
import type { SavedPlace } from '@/types';

export function SavedPlacesManager({ places }: { places: SavedPlace[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<SavedPlace | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<SavedPlace | null>(null);

  function openAdd() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(place: SavedPlace) {
    setEditing(place);
    setShowForm(true);
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Place
        </button>
      </div>

      {places.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved places"
          description="Save your frequent locations like Home, Work or College for faster ride planning."
          action={
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add your first place
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {places.map((place) => (
            <div key={place.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(place)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setToDelete(place)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 font-semibold text-foreground">{place.label}</h3>
              {place.address && (
                <p className="mt-1 text-sm text-muted-foreground">{place.address}</p>
              )}
              {place.latitude != null && place.longitude != null && (
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <PlaceFormModal
        key={editing?.id ?? 'new'}
        open={showForm}
        onOpenChange={setShowForm}
        editing={editing}
        onSaved={() => {
          setShowForm(false);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete "${toDelete?.label}"?`}
        description="This removes the saved place from your account."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          const res = await deleteSavedPlaceAction(toDelete.id);
          if (res.ok) {
            toast.success(res.message ?? 'Removed.');
            router.refresh();
          } else {
            toast.error(res.error);
          }
          setToDelete(null);
        }}
      />
    </>
  );
}

function PlaceFormModal({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SavedPlace | null;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof savedPlaceSchema>, unknown, SavedPlaceInput>({
    resolver: zodResolver(savedPlaceSchema),
    defaultValues: {
      label: editing?.label ?? '',
      address: editing?.address ?? '',
      latitude: editing?.latitude ?? undefined,
      longitude: editing?.longitude ?? undefined,
    },
  });

  async function onSubmit(values: SavedPlaceInput) {
    const res = editing
      ? await updateSavedPlaceAction(editing.id, values)
      : await createSavedPlaceAction(values);
    if (res.ok) {
      toast.success(res.message ?? 'Saved.');
      onSaved();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit Place' : 'Add Saved Place'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <TextField
          label="Label"
          placeholder="Home, Work, College…"
          error={errors.label?.message}
          {...register('label')}
        />
        <TextField
          label="Address"
          placeholder="Street, city"
          error={errors.address?.message}
          {...register('address')}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Latitude"
            type="number"
            step="any"
            placeholder="Optional"
            error={errors.latitude?.message}
            {...register('latitude')}
          />
          <TextField
            label="Longitude"
            type="number"
            step="any"
            placeholder="Optional"
            error={errors.longitude?.message}
            {...register('longitude')}
          />
        </div>
        <SubmitButton loading={isSubmitting}>{editing ? 'Save' : 'Add Place'}</SubmitButton>
      </form>
    </Modal>
  );
}
