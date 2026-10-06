import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, CreditCard, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { NotificationBell } from './NotificationBell';
import { Initials, Mark } from '../ui/bits';
import { IconButton } from '../ui/Button';
import { Menu, menuItemClass } from '../ui/Menu';
import type { User } from '../types';

export interface Crumb {
  label: string;
  to?: string;
}

interface HeaderProps {
  /** Where this page sits under the home screen. The last crumb is the current page. */
  crumbs?: Crumb[];
  /** Page-specific status shown before the global controls (e.g. who is here). */
  aside?: React.ReactNode;
}

const PLAN_NAMES: Record<User['plan'], string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  UNLIMITED: 'Unlimited',
};

function planLine(user: User): string {
  const plan = `${PLAN_NAMES[user.plan]} plan`;
  if (user.usage.unlimited) return `${plan}, unlimited transcriptions`;
  return `${plan}, ${user.usage.remaining ?? 0} of ${user.usage.limit ?? 0} transcriptions left`;
}

/** The top bar: brand, where you are, and the controls that follow you everywhere. */
export function Header({ crumbs = [], aside }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isDark, toggleDark] = useDarkMode();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Small screens have no room for the trail, so they get one labelled link to the level above.
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : crumbs.length === 1 ? { label: 'Projects', to: '/' } : null;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1 border-b border-rule bg-paper px-3 sm:px-5">
      <Link
        to="/"
        aria-label="TranscribeBoard, all projects"
        className={`shrink-0 items-center gap-2 rounded-xs py-1 pr-1 ${crumbs.length ? 'hidden sm:flex' : 'flex'}`}
      >
        <Mark />
        <span className={`font-serif text-[1.0625rem] font-semibold tracking-[-0.01em] ${crumbs.length ? 'hidden md:inline' : ''}`}>
          TranscribeBoard
        </span>
      </Link>

      {parent?.to && (
        <Link
          to={parent.to}
          aria-label={`Back to ${parent.label}`}
          className="-ml-1 flex h-9 min-w-0 items-center gap-0.5 rounded-xs pr-2 pl-1 text-sm font-medium text-ink transition-colors duration-150 hover:bg-wash sm:hidden"
        >
          <ChevronLeft className="h-4 w-4 shrink-0 text-ink-2" aria-hidden />
          <span className="truncate">{parent.label}</span>
        </Link>
      )}

      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="hidden min-w-0 text-sm sm:block">
          <ol className="flex min-w-0 items-center">
            {crumbs.map((crumb, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center">
                  <span aria-hidden className="mx-2 text-rule-2 select-none">
                    /
                  </span>
                  {crumb.to && !last ? (
                    <Link to={crumb.to} className="max-w-[14rem] truncate text-ink-3 transition-colors duration-150 hover:text-ink">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined} className="truncate font-medium text-ink">
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-0.5 pl-2">
        {aside}
        <NotificationBell />
        <IconButton label={isDark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggleDark}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </IconButton>
        <Menu
          button={(trigger) => (
            <button
              type="button"
              {...trigger}
              aria-label="Account"
              className="ml-1 flex h-9 items-center gap-2 rounded-xs pr-1.5 pl-1.5 transition-colors duration-150 hover:bg-wash"
            >
              <Initials name={user?.name ?? ''} />
              <span className="hidden max-w-[9rem] truncate text-sm font-medium lg:block">{user?.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-ink-3" aria-hidden />
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="border-b border-rule px-3 pt-1.5 pb-2.5">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-ink-3">{user?.email}</p>
                {user && <p className="mt-1.5 text-xs text-ink-2">{planLine(user)}</p>}
              </div>
              <Link to="/billing" role="menuitem" onClick={close} className={menuItemClass}>
                <CreditCard className="h-4 w-4 text-ink-3" aria-hidden />
                Plans and billing
              </Link>
              <button type="button" role="menuitem" onClick={handleLogout} className={menuItemClass}>
                <LogOut className="h-4 w-4 text-ink-3" aria-hidden />
                Sign out
              </button>
            </>
          )}
        </Menu>
      </div>
    </header>
  );
}
