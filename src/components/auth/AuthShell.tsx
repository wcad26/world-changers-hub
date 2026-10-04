import React, { useState } from 'react';
import { Link } from '@/lib/router-compat';
import { ArrowLeft, Eye, EyeOff, Loader2, type LucideIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

const LOGO = '/lovable-uploads/49a70c29-0080-4568-ad27-30a1d70295e5.png';

interface AuthShellProps {
  icon: LucideIcon;
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Shared modern glass shell used by every portal login page. */
export function AuthShell({ icon: Icon, badge, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl motion-safe:animate-[auth-float_14s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-secondary/25 blur-3xl motion-safe:animate-[auth-float_18s_ease-in-out_infinite_reverse]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,var(--background)_75%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 py-3 sm:px-8 sm:py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Home</span>
          <span className="sm:hidden">Home</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-4">
        <div className="w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500">
          <div className="mb-4 flex justify-center">
            <img src={LOGO} alt="World Changers Association" className="h-10 w-auto max-w-[180px] sm:h-12 object-contain dark:brightness-0 dark:invert" />
          </div>

          <div className="relative rounded-3xl border border-border/60 bg-card/70 p-5 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-7">
            <div aria-hidden className="absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <div className="mb-5 flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/30">
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {badge}
                </span>
                <h1 className="mt-1 text-xl font-bold leading-tight tracking-tight sm:text-2xl">{title}</h1>
              </div>
            </div>
            <p className="-mt-2 mb-4 text-sm text-muted-foreground">{subtitle}</p>
            {children}
          </div>

          {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
          <p className="mt-4 text-center text-xs text-muted-foreground/70">
            See the Future · Take a Step · Change your World
          </p>
        </div>
      </main>
    </div>
  );
}

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  action?: React.ReactNode;
}

export function AuthField({ label, icon: Icon, action, id, type, className, ...rest }: AuthFieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        {action}
      </div>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          className={cn(
            'h-11 w-full rounded-xl border border-input bg-background/60 pl-11 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/15 disabled:opacity-60',
            className,
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function AuthSubmit({ loading, children, loadingText = 'Signing in…' }: { loading: boolean; children: React.ReactNode; loadingText?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative mt-1 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
    >
      <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />{loadingText}</>) : children}
    </button>
  );
}

export function AuthError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

export function ForgotLink({ to }: { to: string }) {
  return (
    <Link to={to} className="text-xs font-medium text-primary hover:underline">
      Forgot password?
    </Link>
  );
}
