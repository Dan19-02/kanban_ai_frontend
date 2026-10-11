import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppShell, notifyProjectsChanged } from '../components/AppShell';
import { MoreIcon } from '../components/icons';
import {
  Alert, Button, Dialog, Empty, IconButton, Input, Menu, MenuItem, PageLoading, Select, Textarea, cx,
} from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../api/client';
import type { BoardSummary, ProjectSummary, Role } from '../types';
import { colorClasses } from '../lib/projectColors';
import { timeAgo } from '../lib/time';

/** The longest transcript the analysis accepts. */
const TRANSCRIPT_LIMIT = 100_000;

const ROLE_LABEL: Record<Role, string> = { OWNER: 'Owner', EDITOR: 'Editor', VIEWER: 'Viewer' };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Today as "12 Oct", for a board created without a name. */
function defaultBoardName(): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `Meeting on ${today}`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doomedProject, setDoomedProject] = useState<ProjectSummary | null>(null);

  const load = useCallback(() => {
    Promise.all([api.projects.list(), api.boards.list()])
      .then(([{ projects }, { boards }]) => {
        setProjects(projects);
        setBoards(boards);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Your boards and projects could not be loaded. Reload the page to try again.'),
      );
  }, []);

  useEffect(load, [load]);

  const closeProjectDialog = useCallback(() => setDoomedProject(null), []);

  const usage = user?.usage;
  const outOfTranscriptions = !!usage && !usage.unlimited && usage.remaining === 0;
  const loaded = projects !== null && boards !== null;

  return (
    <AppShell crumbs={[{ label: 'Home' }]}>
      <div className="mx-auto w-full max-w-[1040px] px-5 py-10 lg:px-8">
        {outOfTranscriptions && (
          <div className="mb-6">
            <Alert tone="warn">
              {user?.plan === 'FREE'
                ? 'Your free transcriptions are used up. Upgrade to analyse more transcripts.'
                : 'Your transcriptions for this month are used up. Upgrade to analyse more transcripts.'}{' '}
              <Link to="/billing" className="font-medium underline underline-offset-2">See plans</Link>
            </Alert>
          </div>
        )}

        <Composer projects={projects ?? []} />

        {error && (
          <div className="mt-12">
            <Alert>{error}</Alert>
          </div>
        )}

        {!loaded ? (
          !error && <PageLoading />
        ) : (
          <>
            <section aria-labelledby="home-boards" className="mt-12">
              <h2 id="home-boards" className="mb-3 text-title font-semibold tracking-[-0.01em] text-ink">Boards</h2>
              {boards.length === 0 ? (
                <Empty title="No boards yet">
                  Paste a transcript above and choose Create board. Boards shared with you also show up here.
                </Empty>
              ) : (
                <BoardList
                  boards={boards}
                  projects={projects}
                  canDelete={(b) => b.role === 'OWNER'}
                  // Reload so the project counts follow the deleted board.
                  onDeleted={(b) => {
                    setBoards((prev) => prev?.filter((x) => x.id !== b.id) ?? null);
                    load();
                    notifyProjectsChanged();
                  }}
                />
              )}
            </section>

            <section aria-labelledby="home-projects" className="mt-12">
              <h2 id="home-projects" className="mb-3 text-title font-semibold tracking-[-0.01em] text-ink">Projects</h2>
              {projects.length === 0 ? (
                <Empty title="No projects yet">
                  A project groups related boards and lists all their tasks together. Create one with New, next to
                  Projects in the sidebar.
                </Empty>
              ) : (
                <ul className="-mx-2 border-t border-line">
                  {projects.map((p) => (
                    <ProjectRow key={p.id} project={p} onDelete={() => setDoomedProject(p)} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {doomedProject && (
        <DeleteProjectDialog
          project={doomedProject}
          onClose={closeProjectDialog}
          onDeleted={() => {
            setProjects((prev) => prev?.filter((p) => p.id !== doomedProject.id) ?? null);
            setDoomedProject(null);
            notifyProjectsChanged();
          }}
        />
      )}
    </AppShell>
  );
}

// ─── Composer ───────────────────────────────────────────────────────────────

/** The main action of the product: paste a transcript, get a board. */
function Composer({ projects }: { projects: ProjectSummary[] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [transcript, setTranscript] = useState('');
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  // The sidebar's "New board" link sets a fresh timestamp each time it is used.
  const compose = (location.state as { compose?: number } | null)?.compose;
  useEffect(() => {
    if (!compose) return;
    window.scrollTo({ top: 0 });
    box.current?.focus();
  }, [compose]);

  // Boards can only be filed under a project the user owns.
  const owned = projects.filter((p) => p.role === 'OWNER' && !p.archived);
  const text = transcript.trim();
  const tooLong = text.length > TRANSCRIPT_LIMIT;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || tooLong || (!text && !name.trim())) return;
    setBusy(true);
    setError(null);
    try {
      const target = owned.some((p) => p.id === projectId) ? projectId : undefined;
      const { board } = await api.boards.create(name.trim() || defaultBoardName(), target);
      // The board page runs the analysis when it is handed a transcript.
      navigate(`/board/${board.id}`, text ? { state: { transcript: text } } : undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The board could not be created. Try again.');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <h1 className="text-display font-semibold tracking-[-0.02em] text-ink">Paste a meeting transcript</h1>
      <p className="mt-2 text-body text-ink-2">You get a summary, the decisions, and every task with its owner.</p>

      {error && (
        <div className="mt-5">
          <Alert onDismiss={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <Textarea
        ref={box}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={7}
        disabled={busy}
        aria-label="Meeting transcript"
        aria-invalid={tooLong || undefined}
        aria-describedby={tooLong ? 'composer-limit' : undefined}
        placeholder="Paste the transcript here"
        className="mt-5 min-h-28 resize-y"
      />
      {tooLong && (
        <p id="composer-limit" className="mt-1.5 text-meta text-danger">
          This transcript is {text.length.toLocaleString('en-GB')} characters. The limit is{' '}
          {TRANSCRIPT_LIMIT.toLocaleString('en-GB')}, so shorten it before you create the board.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
          maxLength={120}
          aria-label="Board name"
          placeholder="Board name (optional)"
          className="sm:max-w-xs"
        />
        {owned.length > 0 && (
          <Select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={busy}
            aria-label="Project"
            className="h-9! max-sm:w-full! sm:max-w-[14rem]"
          >
            <option value="">No project</option>
            {owned.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        )}
        <Button
          variant="primary"
          type="submit"
          busy={busy}
          disabled={tooLong || (!text && !name.trim())}
          className="h-9! sm:ml-auto"
        >
          Create board
        </Button>
      </div>
    </form>
  );
}

// ─── Board rows ─────────────────────────────────────────────────────────────

/*
 * One list of boards, used on Home and on a project page. Each row is a single
 * link; the title link is stretched over the row so the menu stays a separate
 * control. Pass `projects` to show which project a board belongs to.
 */
export function BoardList({
  boards, projects, canDelete, onDeleted,
}: {
  boards: BoardSummary[];
  projects?: ProjectSummary[];
  canDelete: (board: BoardSummary) => boolean;
  onDeleted: (board: BoardSummary) => void;
}) {
  const [doomed, setDoomed] = useState<BoardSummary | null>(null);
  const close = useCallback(() => setDoomed(null), []);
  const showProject = !!projects;

  return (
    <>
      <ul className="-mx-2 border-t border-line">
        {boards.map((board) => {
          const project = board.projectId ? projects?.find((p) => p.id === board.projectId) : undefined;
          const tasks = board.hasAnalysis ? plural(board.itemCount, 'task', 'tasks') : 'Not analysed yet';
          const people = plural(board.memberCount, 'person', 'people');
          const role = board.role === 'OWNER' ? null : ROLE_LABEL[board.role];
          return (
            <li
              key={board.id}
              className={cx(
                'relative flex items-center gap-4 border-b border-line px-2 py-3 transition-colors hover:bg-wash',
                'md:grid',
                showProject
                  ? 'md:grid-cols-[minmax(0,1fr)_10rem_7.5rem_5.5rem_3.5rem_4.5rem_1.75rem]'
                  : 'md:grid-cols-[minmax(0,1fr)_7.5rem_5.5rem_3.5rem_4.5rem_1.75rem]',
              )}
            >
              <div className="min-w-0 flex-1">
                <Link
                  to={`/board/${board.id}`}
                  className="block truncate font-medium text-ink after:absolute after:inset-0"
                >
                  {board.name}
                </Link>
                {/* Phones: everything else on one line. */}
                <p className="mt-0.5 truncate text-meta text-ink-3 md:hidden">
                  {[project?.name, tasks, people, role, timeAgo(board.updatedAt)].filter(Boolean).join(' · ')}
                </p>
              </div>

              {showProject && (
                <span className="flex min-w-0 items-center gap-2 text-ink-2 max-md:hidden">
                  {project && (
                    <>
                      <span className={cx('h-2 w-2 shrink-0 rounded-full', colorClasses(project.color).dot)} aria-hidden="true" />
                      <span className="truncate">{project.name}</span>
                    </>
                  )}
                </span>
              )}
              <span className={cx('tnum max-md:hidden', board.hasAnalysis ? 'text-ink-2' : 'text-ink-3')}>{tasks}</span>
              <span className="tnum text-ink-2 max-md:hidden">{people}</span>
              <span className="text-ink-2 max-md:hidden">{role}</span>
              <span className="tnum text-right text-meta text-ink-3 max-md:hidden">{timeAgo(board.updatedAt)}</span>

              <span className="relative z-10 -my-1 flex w-7 shrink-0 justify-end">
                {canDelete(board) && (
                  <Menu
                    trigger={(props) => (
                      <IconButton label={`More actions for ${board.name}`} {...props}><MoreIcon /></IconButton>
                    )}
                  >
                    {(closeMenu) => (
                      <MenuItem danger onClick={() => { closeMenu(); setDoomed(board); }}>Delete board</MenuItem>
                    )}
                  </Menu>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {doomed && (
        <DeleteBoardDialog
          board={doomed}
          onClose={close}
          onDeleted={() => {
            setDoomed(null);
            onDeleted(doomed);
          }}
        />
      )}
    </>
  );
}

function DeleteBoardDialog({
  board, onClose, onDeleted,
}: { board: BoardSummary; onClose: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.boards.remove(board.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The board could not be deleted. Try again.');
      setBusy(false);
    }
  };

  return (
    <Dialog
      title="Delete board?"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={remove} busy={busy}>Delete board</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 pb-2">
        {error && <Alert>{error}</Alert>}
        <p className="text-ui text-ink-2">
          <span className="font-medium text-ink">{board.name}</span> and its{' '}
          {board.itemCount > 0 ? plural(board.itemCount, 'task', 'tasks') : 'contents'} will be removed for everyone
          it is shared with. This cannot be undone.
        </p>
      </div>
    </Dialog>
  );
}

// ─── Project rows ───────────────────────────────────────────────────────────

function ProjectRow({ project, onDelete }: { project: ProjectSummary; onDelete: () => void }) {
  const boards = plural(project.boardCount, 'board', 'boards');
  const open = plural(project.openTaskCount, 'open task', 'open tasks');
  const role = project.role === 'OWNER' ? null : ROLE_LABEL[project.role];
  return (
    <li className="relative flex items-center gap-4 border-b border-line px-2 py-3 transition-colors hover:bg-wash md:grid md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_5.5rem_7.5rem_3.5rem_4.5rem_1.75rem]">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cx('h-2 w-2 shrink-0 rounded-full', colorClasses(project.color).dot)} aria-hidden="true" />
          <Link
            to={`/project/${project.id}`}
            className="block truncate font-medium text-ink after:absolute after:inset-0"
          >
            {project.name}
          </Link>
        </div>
        <p className="mt-0.5 truncate text-meta text-ink-3 md:hidden">
          {[boards, open, role, timeAgo(project.updatedAt)].filter(Boolean).join(' · ')}
        </p>
      </div>

      <span className="truncate text-ink-2 max-md:hidden">{project.description}</span>
      <span className="tnum text-ink-2 max-md:hidden">{boards}</span>
      <span className="tnum text-ink-2 max-md:hidden">{open}</span>
      <span className="text-ink-2 max-md:hidden">{role}</span>
      <span className="tnum text-right text-meta text-ink-3 max-md:hidden">{timeAgo(project.updatedAt)}</span>

      <span className="relative z-10 -my-1 flex w-7 shrink-0 justify-end">
        {project.role === 'OWNER' && (
          <Menu
            trigger={(props) => (
              <IconButton label={`More actions for ${project.name}`} {...props}><MoreIcon /></IconButton>
            )}
          >
            {(closeMenu) => (
              <MenuItem danger onClick={() => { closeMenu(); onDelete(); }}>Delete project</MenuItem>
            )}
          </Menu>
        )}
      </span>
    </li>
  );
}

function DeleteProjectDialog({
  project, onClose, onDeleted,
}: { project: ProjectSummary; onClose: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The server refuses to delete a project that still has boards.
  const blocked = project.boardCount > 0;

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.projects.remove(project.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The project could not be deleted. Try again.');
      setBusy(false);
    }
  };

  return (
    <Dialog
      title="Delete project?"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={remove} busy={busy} disabled={blocked}>Delete project</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 pb-2">
        {error && <Alert>{error}</Alert>}
        <p className="text-ui text-ink-2">
          {blocked ? (
            <>
              <span className="font-medium text-ink">{project.name}</span> still has{' '}
              {plural(project.boardCount, 'board', 'boards')}. Delete {project.boardCount === 1 ? 'it' : 'them'} first,
              then delete the project.
            </>
          ) : (
            <>
              <span className="font-medium text-ink">{project.name}</span> will be removed for everyone it is shared
              with. This cannot be undone.
            </>
          )}
        </p>
      </div>
    </Dialog>
  );
}
