import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell, ColorPicker, notifyProjectsChanged } from '../components/AppShell';
import { ShareModal } from '../components/ShareModal';
import {
  Alert, Button, Checkbox, Dialog, Empty, Field, Input, Monogram, PageLoading, Segmented, Select, Tabs, Textarea,
  buttonClass, cx,
} from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../api/client';
import type { BoardSummary, Project, ProjectColor, RollupTask } from '../types';
import { colorClasses } from '../lib/projectColors';
import { BoardList } from './DashboardPage';

type Tab = 'boards' | 'tasks';
type StatusFilter = 'all' | 'pending' | 'completed';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** A due date as "15 Oct". Anything that is not a date is shown as written. */
function formatDue(value: string): string {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = iso ? new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  // Keyed so moving between projects starts from a clean state.
  return <ProjectView key={id} projectId={id} />;
}

function ProjectView({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [tasks, setTasks] = useState<RollupTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>('boards');

  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const isOwner = project?.role === 'OWNER';
  const canEdit = !!project && project.role !== 'VIEWER'; // owner or editor

  useEffect(() => {
    api.projects
      .get(projectId)
      .then(({ project, boards }) => {
        setProject(project);
        setBoards(boards);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(err instanceof ApiError ? err.message : 'The project could not be loaded. Reload the page to try again.');
      });
    // Loaded up front so the tab can show its count.
    api.projects
      .tasks(projectId)
      .then(({ tasks }) => setTasks(tasks))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) return;
        setError(err instanceof ApiError ? err.message : 'The tasks could not be loaded. Reload the page to try again.');
      });
  }, [projectId]);

  const closeCreating = useCallback(() => setCreating(false), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);
  const closeShare = useCallback(() => setShowShare(false), []);

  if (notFound) {
    return (
      <AppShell crumbs={[{ label: 'Home', to: '/' }, { label: 'Project not found' }]}>
        <div className="mx-auto w-full max-w-[1040px] px-5 py-10 lg:px-8">
          <Empty title="Project not found">
            <p>It may have been deleted, or you do not have access to it.</p>
            <Link to="/" className={buttonClass('secondary', 'md', 'mt-4')}>Back to Home</Link>
          </Empty>
        </div>
      </AppShell>
    );
  }

  if (!project || !boards) {
    return (
      <AppShell crumbs={[{ label: 'Home', to: '/' }, { label: 'Project' }]}>
        <div className="mx-auto w-full max-w-[1040px] px-5 py-10 lg:px-8">
          {error ? <Alert>{error}</Alert> : <PageLoading />}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      crumbs={[{ label: 'Home', to: '/' }, { label: project.name }]}
      actions={
        // Sharing, settings and new boards are the owner's: the server refuses them from anyone else.
        isOwner && (
          <>
            <Button variant="ghost" onClick={() => setShowShare(true)}>Share</Button>
            <Button variant="ghost" onClick={() => setShowSettings(true)}>Settings</Button>
            <Button variant="primary" onClick={() => setCreating(true)}>New board</Button>
          </>
        )
      }
    >
      <div className="mx-auto w-full max-w-[1040px] px-5 py-10 lg:px-8">
        <header>
          <div className="flex items-baseline gap-3">
            <span
              className={cx('h-2.5 w-2.5 relative -top-[0.3rem] shrink-0 rounded-full', colorClasses(project.color).dot)}
              aria-hidden="true"
            />
            <h1 className="min-w-0 break-words text-display font-semibold leading-tight tracking-[-0.02em] text-ink">
              {project.name}
            </h1>
          </div>
          {project.description && <p className="mt-2 max-w-2xl text-body text-ink-2">{project.description}</p>}
          {!isOwner && (
            <p className="mt-2 text-meta text-ink-3">
              {project.role === 'VIEWER'
                ? 'Shared with you as a viewer. You can read everything here.'
                : 'Shared with you as an editor. You can update tasks.'}
            </p>
          )}
        </header>

        <div className="mt-8">
          <Tabs<Tab>
            label="Project views"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'boards', label: 'Boards', count: boards.length },
              { value: 'tasks', label: 'All tasks', count: tasks?.length },
            ]}
          />
        </div>

        {error && (
          <div className="mt-5">
            <Alert onDismiss={() => setError(null)}>{error}</Alert>
          </div>
        )}

        <div className="mt-5" role="tabpanel" aria-label={tab === 'boards' ? 'Boards' : 'All tasks'}>
          {tab === 'boards' ? (
            boards.length === 0 ? (
              <Empty title="No boards yet">
                {isOwner ? (
                  <>
                    <p>Add a board for each call or meeting, and paste its transcript to turn it into tasks.</p>
                    <Button variant="primary" className="mt-4" onClick={() => setCreating(true)}>New board</Button>
                  </>
                ) : (
                  'The owner has not added a board to this project yet.'
                )}
              </Empty>
            ) : (
              <BoardList
                boards={boards}
                canDelete={() => isOwner}
                onDeleted={(board) => {
                  setBoards((prev) => prev?.filter((b) => b.id !== board.id) ?? null);
                  setTasks((prev) => prev?.filter((t) => t.boardId !== board.id) ?? null);
                  notifyProjectsChanged();
                }}
              />
            )
          ) : (
            <TasksTab tasks={tasks} setTasks={setTasks} canEdit={canEdit} onError={setError} />
          )}
        </div>
      </div>

      {creating && isOwner && <NewBoardDialog projectId={projectId} onClose={closeCreating} />}

      {showSettings && isOwner && (
        <SettingsDialog
          project={project}
          boardCount={boards.length}
          onClose={closeSettings}
          onUpdated={(p) => {
            setProject(p);
            notifyProjectsChanged();
          }}
          onDeleted={() => {
            notifyProjectsChanged();
            navigate('/');
          }}
        />
      )}

      {showShare && isOwner && <ShareModal kind="project" id={project.id} onClose={closeShare} />}
    </AppShell>
  );
}

// ─── All tasks ──────────────────────────────────────────────────────────────

const PRIORITY_CLASS: Record<NonNullable<RollupTask['priority']>, string> = {
  High: 'font-medium text-danger',
  Medium: 'text-ink-2',
  Low: 'text-ink-3',
};

/** Every task from every board in the project, in one list. */
function TasksTab({
  tasks, setTasks, canEdit, onError,
}: {
  tasks: RollupTask[] | null;
  setTasks: React.Dispatch<React.SetStateAction<RollupTask[] | null>>;
  canEdit: boolean;
  onError: (message: string) => void;
}) {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [assignee, setAssignee] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const assignees = useMemo(
    () => Array.from(new Set((tasks ?? []).map((t) => t.assignee))).sort(),
    [tasks],
  );

  const filtered = useMemo(
    () =>
      (tasks ?? []).filter(
        (t) =>
          (statusFilter === 'all' || t.status === statusFilter) &&
          (assignee === 'all' || t.assignee === assignee),
      ),
    [tasks, statusFilter, assignee],
  );

  const stats = useMemo(() => {
    const list = tasks ?? [];
    const open = list.filter((t) => t.status === 'pending').length;
    return { total: list.length, open, done: list.length - open };
  }, [tasks]);

  const toggle = async (task: RollupTask) => {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    setBusyId(task.id);
    // Optimistic update.
    setTasks((prev) => prev?.map((t) => (t.id === task.id ? { ...t, status: next } : t)) ?? null);
    try {
      await api.boards.updateItem(task.boardId, task.id, { status: next });
      notifyProjectsChanged(); // the sidebar shows the open count
    } catch (err) {
      // Revert on failure.
      setTasks((prev) => prev?.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)) ?? null);
      onError(err instanceof ApiError ? err.message : 'The task could not be updated. Try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (tasks === null) return <PageLoading />;
  if (tasks.length === 0) {
    return (
      <Empty title="No tasks yet">
        Tasks from every board in this project show up here, in one list. Open a board and paste its transcript to
        get the first ones.
      </Empty>
    );
  }

  return (
    <div>
      <p className="tnum text-ui text-ink-2">
        <span className="font-medium text-ink">{plural(stats.total, 'task', 'tasks')}</span>
        {', '}{stats.open} open, {stats.done} done
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Segmented<StatusFilter>
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Open' },
            { value: 'completed', label: 'Done' },
          ]}
        />
        <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Owner" className="max-w-[14rem]">
          <option value="all">Everyone</option>
          {assignees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <span className="tnum ml-auto text-meta text-ink-3" role="status">{filtered.length} shown</span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <Empty title="No tasks match these filters">
            <Button
              className="mt-3"
              onClick={() => {
                setStatusFilter('all');
                setAssignee('all');
              }}
            >
              Show all tasks
            </Button>
          </Empty>
        </div>
      ) : (
        <ul className="-mx-2 mt-4 border-t border-line">
          {filtered.map((task) => {
            const done = task.status === 'completed';
            const mine = !!user && task.assignee === user.name;
            const blocked = !done && task.blockedBy.length > 0;
            const due = task.dueDate ? formatDue(task.dueDate) : null;
            return (
              <li
                key={task.id}
                className="relative flex items-start gap-3 border-b border-line px-2 py-3 transition-colors hover:bg-wash md:grid md:grid-cols-[1.125rem_minmax(0,1fr)_10rem_10rem_4rem_4.5rem] md:gap-4"
              >
                <span className="relative z-10 mt-px flex">
                  <Checkbox
                    checked={done}
                    onChange={() => toggle(task)}
                    disabled={!canEdit || busyId === task.id}
                    label={done ? `Mark "${task.title}" as open` : `Mark "${task.title}" as done`}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  {/* The row opens the board the task came from. */}
                  <Link
                    to={`/board/${task.boardId}`}
                    className={cx(
                      'block after:absolute after:inset-0 md:truncate',
                      done ? 'text-ink-3 line-through' : 'font-medium text-ink',
                    )}
                  >
                    {task.title}
                  </Link>
                  {blocked && (
                    <p className="mt-0.5 text-meta text-danger md:truncate">Blocked by {task.blockedBy.join(', ')}</p>
                  )}
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-meta text-ink-3 md:hidden">
                    <Monogram name={task.assignee} mine={mine} size="sm" />
                    <span className="text-ink-2">{task.assignee}</span>
                    <span aria-hidden="true">·</span>
                    <span>{task.boardName}</span>
                    {task.priority && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className={PRIORITY_CLASS[task.priority]}>{task.priority}</span>
                      </>
                    )}
                    {due && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tnum">{due}</span>
                      </>
                    )}
                  </p>
                </div>

                <span className="flex min-w-0 items-center gap-2 text-ink-2 max-md:hidden">
                  <Monogram name={task.assignee} mine={mine} size="sm" />
                  <span className="truncate">{task.assignee}</span>
                </span>
                <span className="truncate text-ink-2 max-md:hidden">{task.boardName}</span>
                <span className={cx('max-md:hidden', task.priority && PRIORITY_CLASS[task.priority])}>{task.priority}</span>
                <span className="tnum text-right text-ink-2 max-md:hidden">{due}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── New board ──────────────────────────────────────────────────────────────

function NewBoardDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  // Start in the name field rather than on the dialog's close button.
  useEffect(() => nameInput.current?.focus(), []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { board } = await api.boards.create(name.trim(), projectId);
      const text = transcript.trim();
      // The board page runs the analysis when it is handed a transcript.
      navigate(`/board/${board.id}`, text ? { state: { transcript: text } } : undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The board could not be created. Try again.');
      setBusy(false);
    }
  };

  return (
    <Dialog
      title="New board"
      onClose={onClose}
      width="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="new-board" busy={busy} disabled={!name.trim()}>
            Create board
          </Button>
        </>
      }
    >
      <form id="new-board" onSubmit={submit} className="flex flex-col gap-4 pb-2">
        {error && <Alert>{error}</Alert>}
        <Field label="Name">
          {(p) => (
            <Input
              {...p}
              ref={nameInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Monday standup"
              disabled={busy}
              maxLength={120}
            />
          )}
        </Field>
        <Field label="Transcript" hint="Optional. Paste it now, or add it on the board later.">
          {(p) => (
            <Textarea
              {...p}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={6}
              disabled={busy}
              className="resize-y"
            />
          )}
        </Field>
      </form>
    </Dialog>
  );
}

// ─── Settings ───────────────────────────────────────────────────────────────

function SettingsDialog({
  project, boardCount, onClose, onUpdated, onDeleted,
}: {
  project: Project;
  boardCount: number;
  onClose: () => void;
  onUpdated: (p: Project) => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [color, setColor] = useState<ProjectColor>(project.color);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const confirmText = useRef<HTMLParagraphElement>(null);

  // The button that opened the confirmation is gone, so move focus into it.
  useEffect(() => {
    if (confirming) confirmText.current?.focus();
  }, [confirming]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setErr(null);
    try {
      const { project: updated } = await api.projects.update(project.id, {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        color,
      });
      onUpdated(updated);
      onClose();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : 'The changes could not be saved. Try again.');
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    setErr(null);
    try {
      await api.projects.remove(project.id);
      onDeleted();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : 'The project could not be deleted. Try again.');
      setDeleting(false);
    }
  };

  // Deleting is confirmed in the same dialog, as a second step.
  if (confirming) {
    return (
      <Dialog
        title="Delete project?"
        onClose={onClose}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setConfirming(false); setErr(null); }}>Cancel</Button>
            <Button variant="danger" onClick={remove} busy={deleting}>Delete project</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 pb-2">
          {err && <Alert>{err}</Alert>}
          <p ref={confirmText} tabIndex={-1} className="text-ui text-ink-2 outline-none">
            <span className="font-medium text-ink">{project.name}</span> will be removed for everyone it is shared
            with. This cannot be undone.
          </p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title="Project settings"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="project-settings" busy={saving} disabled={!name.trim()}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="project-settings" onSubmit={save} className="flex flex-col gap-4">
        {err && <Alert>{err}</Alert>}
        <Field label="Name">
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} disabled={saving} maxLength={120} />}
        </Field>
        <Field label="Description" hint="Optional. One line on what this project covers.">
          {(p) => (
            <Textarea {...p} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} rows={2} maxLength={500} />
          )}
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-ui font-medium text-ink">Colour</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </form>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pb-2 pt-4">
        <div className="min-w-0">
          <p className="text-ui font-medium text-ink">Delete project</p>
          <p className="text-meta text-ink-2">
            {boardCount > 0
              ? `Delete its ${plural(boardCount, 'board', 'boards')} first.`
              : 'This project has no boards and can be deleted.'}
          </p>
        </div>
        <Button variant="danger" onClick={() => setConfirming(true)} disabled={boardCount > 0 || saving}>
          Delete project
        </Button>
      </div>
    </Dialog>
  );
}
