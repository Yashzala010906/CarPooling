'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Camera, Loader2, Phone, Trash2, User } from 'lucide-react';

import { SubmitButton, TextField } from '@/components/ui/form';
import { Avatar } from '@/components/ui/primitives';
import { removeAvatarAction, updateProfileAction, uploadAvatarAction } from '@/lib/actions/profile';
import { profileSchema, type ProfileInput } from '@/lib/validations';

export function EditProfileForm({
  initial,
}: {
  initial: { fullName: string; phone: string; avatarUrl: string | null };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [uploading, startUpload] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: initial.fullName, phone: initial.phone },
  });

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    startUpload(async () => {
      const res = await uploadAvatarAction(fd);
      if (res.ok && res.data) {
        setAvatarUrl(res.data.url);
        toast.success('Avatar updated.');
        router.refresh();
      } else if (!res.ok) {
        toast.error(res.error);
      }
      if (fileRef.current) fileRef.current.value = '';
    });
  }

  function onRemoveAvatar() {
    startUpload(async () => {
      const res = await removeAvatarAction();
      if (res.ok) {
        setAvatarUrl(null);
        toast.success('Avatar removed.');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  async function onSubmit(values: ProfileInput) {
    const res = await updateProfileAction(values);
    if (res.ok) {
      toast.success(res.message ?? 'Profile updated.');
      router.push('/profile');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-5">
        <div className="relative">
          <Avatar src={avatarUrl} name={initial.fullName} size={72} />
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </span>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              <Camera className="h-4 w-4" /> Upload photo
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={onRemoveAvatar}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 2MB.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPickFile}
          />
        </div>
      </div>

      {/* Fields */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-xl border border-border bg-card p-5"
        noValidate
      >
        <TextField
          label="Full Name"
          icon={User}
          placeholder="John Doe"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <TextField
          label="Phone Number"
          icon={Phone}
          type="tel"
          placeholder="+1 (555) 000-0000"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <div className="flex gap-3 pt-2">
          <SubmitButton loading={isSubmitting} className="w-auto px-6">
            Save Changes
          </SubmitButton>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
