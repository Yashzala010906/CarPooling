'use client';

import * as React from 'react';
import { Eye, EyeOff, Loader2, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/* Field label + error wrapper                                                */
/* -------------------------------------------------------------------------- */
function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="ml-0.5 text-xs font-semibold text-muted-foreground">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="ml-0.5 text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="ml-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  'w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition-all ' +
  'placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

/* -------------------------------------------------------------------------- */
/* TextField (optional leading icon)                                          */
/* -------------------------------------------------------------------------- */
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  wrapperClassName?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, icon: Icon, id, className, wrapperClassName, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <FieldShell
        label={label}
        htmlFor={inputId}
        error={error}
        hint={hint}
        className={wrapperClassName}
      >
        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputBase,
              Icon && 'pl-10',
              error && 'border-destructive focus:border-destructive focus:ring-destructive',
              className,
            )}
            aria-invalid={!!error}
            {...props}
          />
        </div>
      </FieldShell>
    );
  },
);
TextField.displayName = 'TextField';

/* -------------------------------------------------------------------------- */
/* PasswordField (show/hide toggle)                                           */
/* -------------------------------------------------------------------------- */
export const PasswordField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, icon: Icon, id, className, wrapperClassName, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    const inputId = id ?? props.name;
    return (
      <FieldShell
        label={label}
        htmlFor={inputId}
        error={error}
        hint={hint}
        className={wrapperClassName}
      >
        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <input
            ref={ref}
            id={inputId}
            type={show ? 'text' : 'password'}
            className={cn(
              inputBase,
              Icon && 'pl-10',
              'pr-10',
              error && 'border-destructive focus:border-destructive focus:ring-destructive',
              className,
            )}
            aria-invalid={!!error}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FieldShell>
    );
  },
);
PasswordField.displayName = 'PasswordField';

/* -------------------------------------------------------------------------- */
/* TextArea                                                                   */
/* -------------------------------------------------------------------------- */
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <FieldShell label={label} htmlFor={inputId} error={error} hint={hint}>
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            inputBase,
            'min-h-[90px] resize-y',
            error && 'border-destructive',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
      </FieldShell>
    );
  },
);
TextArea.displayName = 'TextArea';

/* -------------------------------------------------------------------------- */
/* SelectField                                                                */
/* -------------------------------------------------------------------------- */
interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}
export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, id, className, children, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <FieldShell label={label} htmlFor={inputId} error={error} hint={hint}>
        <select
          ref={ref}
          id={inputId}
          className={cn(inputBase, 'appearance-none', error && 'border-destructive', className)}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
      </FieldShell>
    );
  },
);
SelectField.displayName = 'SelectField';

/* -------------------------------------------------------------------------- */
/* SubmitButton (loading spinner)                                             */
/* -------------------------------------------------------------------------- */
export function SubmitButton({
  loading,
  children,
  className,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: 'primary' | 'outline';
}) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border-2 border-primary bg-transparent text-primary hover:bg-primary/5',
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
