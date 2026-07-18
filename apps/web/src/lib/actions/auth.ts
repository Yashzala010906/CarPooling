'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from '@/lib/validations';
import type { ActionResult } from '@/types';

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

/** Register a new user via Supabase Auth. The DB trigger creates the profile. */
export async function registerAction(
  input: RegisterInput,
): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the errors and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const { fullName, email, phone, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone: phone || null },
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=/dashboard`,
    },
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    return { ok: false, error: error.message };
  }

  // When confirmation is on, Supabase returns a user with no identities for an
  // already-registered email (to prevent account enumeration).
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const needsConfirmation = !data.session;
  return { ok: true, data: { needsConfirmation } };
}

/** Sign in with email + password. Session is stored in cookies. */
export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the errors and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Generic message — never reveal whether the email exists.
    return { ok: false, error: 'Invalid email or password.' };
  }
  return { ok: true };
}

/** Sign out and clear the session, then redirect to login. */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/** Send a password-reset email. Always reports success to avoid enumeration. */
export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/reset-password`,
  });

  // Intentionally generic regardless of whether the email exists.
  return { ok: true, message: 'If an account exists for that email, a reset link is on its way.' };
}

/** Set a new password. Requires an active recovery session (via /auth/confirm). */
export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the errors and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Your reset link has expired. Please request a new one.' };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.message };

  return { ok: true, message: 'Password updated. You can now sign in.' };
}

/** Verify a 6-digit email OTP (e.g. signup confirmation) via Supabase. */
export async function verifyOtpAction(input: {
  email: string;
  token: string;
}): Promise<ActionResult> {
  const email = input.email?.trim();
  const token = input.token?.trim();
  if (!email || !/^\d{6}$/.test(token)) {
    return { ok: false, error: 'Enter the 6-digit code sent to your email.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) {
    return { ok: false, error: 'Invalid or expired code. Please try again.' };
  }
  return { ok: true };
}

/** Resend the signup confirmation OTP/email. */
export async function resendOtpAction(input: { email: string }): Promise<ActionResult> {
  const email = input.email?.trim();
  if (!email) return { ok: false, error: 'Email is required.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/confirm?next=/dashboard` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: 'A new code is on its way.' };
}

/** Change password for a signed-in user, re-verifying the current password. */
export async function changePasswordAction(input: ChangePasswordInput): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the errors and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, error: 'You must be signed in.' };
  }

  // Re-authenticate with the current password before allowing a change.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return {
      ok: false,
      error: 'Your current password is incorrect.',
      fieldErrors: { currentPassword: ['Incorrect password'] },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { ok: false, error: error.message };

  return { ok: true, message: 'Password changed successfully.' };
}
