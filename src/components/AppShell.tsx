import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';
import { PROJECT_COLORS, colorClasses } from '../lib/projectColors';
import { timeAgo } from '../lib/time';
import type { AppNotification, ProjectColor, ProjectSummary } from '../types';
import { ChevronDownIcon, CloseIcon, MenuIcon } from './icons';
import {
  Alert, Button, Dialog, Field, IconButton, Input, Menu, MenuItem, Monogram, Textarea, Wordmark, buttonClass, cx,
} from './ui';

/** Fire this after creating, renaming or deleting a project so the sidebar reloads. */
export const PROJECTS_CHANGED = 'tb:projects-changed';
export function notifyProjectsChanged() {
  window.dispatchEvent(new Event(PROJECTS_CHANGED));
}

export interface Crumb {
  label: string;
  to?: string;
}

interface AppShellProps {
  /** Where this page sits, left to right. The last crumb is the current page. */
  crumbs?: Crumb[];
  /** Page-level actions, shown at the right of the top bar. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** The frame every signed-in page lives in: sidebar, top bar, content. */
export function AppShell({ crumbs = [], actions, children }: AppShellProps) {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  // Close the phone drawer whenever the route changes.
  useEffect(() => setDrawer(false), [location.pathname]);

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-wash lg:block">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-scrim" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] bg-wash shadow-pop">
            <Sidebar onClose={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-line bg-paper px-3 lg:px-8">
          <IconButton label="Open menu" onClick={() => setDrawer(true)} className="lg:hidden">
            <MenuIcon />
          </IconButton>
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-ui">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <React.Fragment key={`${c.label}-${i}`}>
                  {i > 0 && <span aria-hidden="true" className="text-ink-3 max-sm:hidden">/</span>}
                  {c.to && !last ? (
                    <Link to={c.to} className="shrink-0 text-ink-2 hover:text-ink max-sm:hidden">{c.label}</Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined} className={cx('truncate', last ? 'font-medium text-ink' : 'text-ink-2 max-sm:hidden')}>
                      {c.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

const navRow =
  'flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-ui text-ink-2 transition-colors hover:bg-wash-2 hover:text-ink';
const navRowActive = 'bg-wash-2 font-medium text-ink';

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const [isDark, toggleDark] = useDarkMode();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api.projects.list().then((r) => setProjects(r.projects.filter((p) => !p.archived))).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(PROJECTS_CHANGED, load);
    return () => window.removeEventListener(PROJECTS_CHANGED, load);
  }, [load]);

  const usage = user?.usage;
  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        <Link to="/" aria-label="TranscribeBoard, home"><Wordmark /></Link>
        {onClose && <IconButton label="Close menu" onClick={onClose}><CloseIcon /></IconButton>}
      </div>

      <div className="px-3 pb-3 pt-1">
        <Link to="/" state={{ compose: Date.now() }} className={buttonClass('primary', 'md', 'w-full')}>
          New board
        </Link>
      </div>

      <nav aria-label="Main" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        <NavLink to="/" end className={({ isActive }) => cx(navRow, isActive && navRowActive)}>
          Home
        </NavLink>
        <Inbox />

        <div className="mt-5 flex items-center justify-between pl-2.5 pr-1">
          <h2 className="text-meta font-medium text-ink-3">Projects</h2>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded px-1.5 py-0.5 text-meta text-ink-2 hover:bg-wash-2 hover:text-ink"
          >
            New
          </button>
        </div>
        {projects === null ? null : projects.length === 0 ? (
          <p className="px-2.5 py-1 text-meta text-ink-3">Group related boards in a project.</p>
        ) : (
          projects.map((p) => (
            <NavLink
              key={p.id}
              to={`/project/${p.id}`}
              className={({ isActive }) => cx(navRow, isActive && navRowActive)}
            >
              <span className={cx('h-2 w-2 shrink-0 rounded-full', colorClasses(p.color).dot)} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {p.openTaskCount > 0 && (
                <span className="tnum text-meta font-normal text-ink-3" title={`${p.openTaskCount} open tasks`}>
                  {p.openTaskCount}
                </span>
              )}
            </NavLink>
          ))
        )}
      </nav>

      <div className="shrink-0 border-t border-line px-3 py-3">
        {usage && !usage.unlimited && (
          <Link to="/billing" className="mb-2 block rounded-md px-2.5 py-2 hover:bg-wash-2">
            <span className="flex items-baseline justify-between text-meta text-ink-2">
              <span>
                <span className="tnum font-medium text-ink">{usage.used} of {usage.limit ?? 0}</span>{' '}
                {user?.plan === 'FREE' ? 'free transcriptions' : 'this month'}
              </span>
              <span className={cx(usage.remaining === 0 && 'font-medium text-danger')}>
                {usage.remaining === 0 ? 'Upgrade' : 'Plans'}
              </span>
            </span>
            <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <span
                className={cx('block h-full rounded-full', usage.remaining === 0 ? 'bg-danger' : 'bg-ink')}
                style={{ width: `${usage.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0}%` }}
              />
            </span>
          </Link>
        )}

        <Menu
          side="top"
          align="left"
          trigger={(props) => (
            <button type="button" {...props} className={cx(navRow, 'h-9 text-ink')}>
              <Monogram name={user?.name ?? ''} mine />
              <span className="min-w-0 flex-1 truncate text-left">{user?.name}</span>
              <ChevronDownIcon className="text-ink-3" />
            </button>
          )}
        >
          {(close) => (
            <div className="w-52">
              <p className="truncate px-2.5 pb-1.5 pt-1 text-meta text-ink-3">{user?.email}</p>
              <MenuItem onClick={() => { close(); navigate('/billing'); }}>
                Plans and billing
                <span className="text-meta text-ink-3">{user?.plan.toLowerCase()}</span>
              </MenuItem>
              <MenuItem onClick={toggleDark}>{isDark ? 'Light theme' : 'Dark theme'}</MenuItem>
              <MenuItem onClick={signOut}>Sign out</MenuItem>
            </div>
          )}
        </Menu>
      </div>

      {creating && <NewProjectDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

// ─── Inbox ──────────────────────────────────────────────────────────────────

/** Mentions and assignments. Lives in the sidebar; opens a panel beside it. */
function Inbox() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api.notifications
      .list()
      .then(({ notifications, unread }) => {
        setItems(notifications);
        setUnread(unread);
      })
      .catch(() => {
        /* offline or signed out: try again on the next tick */
      });
  }, []);

  // First fetch, then light polling so the count stays current.
  useEffect(() => {
    load();
    const t = setInterval(load, 45_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = async () => {
    if (open) return setOpen(false);
    setOpen(true);
    if (unread > 0) {
      // Keep the unread marks visible in the panel; clear the count.
      setUnread(0);
      try {
        await api.notifications.markAllRead();
      } catch {
        load(); // restore the true state if marking read failed
      }
    }
  };

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={toggle} aria-expanded={open} className={cx(navRow, open && navRowActive)}>
        <span className="flex-1 text-left">Inbox</span>
        {unread > 0 && (
          <span className="tnum rounded bg-mark px-1.5 text-meta font-medium text-on-mark" aria-label={`${unread} unread`}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Inbox"
          className="absolute left-0 top-full z-40 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-lg bg-paper shadow-pop lg:left-full lg:top-0 lg:ml-3 lg:mt-0"
        >
          <p className="px-4 pb-1 pt-3 text-ui font-semibold text-ink">Inbox</p>
          {items.length === 0 ? (
            <p className="px-4 pb-5 pt-1 text-ui text-ink-2">
              Nothing yet. Mentions and tasks assigned to you show up here.
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto pb-1">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (n.boardId) navigate(`/board/${n.boardId}`);
                    }}
                    className="flex w-full gap-3 px-4 py-2.5 text-left transition-colors hover:bg-wash"
                  >
                    <Monogram name={n.actorName} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-ui text-ink">
                        <span className="font-medium">{n.actorName}</span>{' '}
                        {n.type === 'mention' ? 'mentioned you' : 'gave you a task'}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-ui text-ink-2">{n.text}</span>
                      <span className="mt-0.5 block text-meta text-ink-3">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-mark ring-1 ring-ink/20" aria-label="Unread" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── New project ────────────────────────────────────────────────────────────

const COLOR_NAMES: Record<ProjectColor, string> = {
  indigo: 'Blue', emerald: 'Green', amber: 'Amber', rose: 'Rose', sky: 'Sky', violet: 'Violet', teal: 'Teal', slate: 'Grey',
};

/** The colour picker used when creating or editing a project. */
export function ColorPicker({ value, onChange }: { value: ProjectColor; onChange: (c: ProjectColor) => void }) {
  return (
    <div role="radiogroup" aria-label="Colour" className="flex gap-2">
      {PROJECT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={COLOR_NAMES[c]}
          title={COLOR_NAMES[c]}
          onClick={() => onChange(c)}
          className={cx(
            'h-6 w-6 rounded-full transition-shadow',
            colorClasses(c).dot,
            value === c ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper' : 'hover:ring-2 hover:ring-line-strong hover:ring-offset-2 hover:ring-offset-paper',
          )}
        />
      ))}
    </div>
  );
}

function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ProjectColor>('indigo');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { project } = await api.projects.create({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      notifyProjectsChanged();
      onClose();
      navigate(`/project/${project.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The project could not be created. Try again.');
      setBusy(false);
    }
  };

  return (
    <Dialog
      title="New project"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="new-project" busy={busy} disabled={!name.trim()}>
            Create project
          </Button>
        </>
      }
    >
      <form id="new-project" onSubmit={submit} className="flex flex-col gap-4 pb-2">
        {error && <Alert>{error}</Alert>}
        <Field label="Name">
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mobile app launch" maxLength={120} autoFocus />}
        </Field>
        <Field label="Description" hint="Optional. One line on what this project covers.">
          {(p) => <Textarea {...p} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} />}
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-ui font-medium text-ink">Colour</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </form>
    </Dialog>
  );
}
