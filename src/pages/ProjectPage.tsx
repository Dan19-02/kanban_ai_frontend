import React, { useEffect, useId, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Settings, Trash2, UserPlus } from 'lucide-react';
import { Header } from '../components/Header';
import { ShareDialog } from '../components/ShareDialog';
import { api, ApiError } from '../api/client';
import type { BoardSummary, Project, ProjectColor, RollupTask } from '../types';
import { count, dueInfo, duePhrase } from '../lib/format';
import { timeAgo } from '../lib/time';
import { usePageTitle } from '../lib/title';
import {
  Checkbox, ColorPicker, EmptyPage, FullScreenLoader, Initials, Notice, PageHead, PriorityMark, Segmented, Spine, Tabs,
} from '../ui/bits';
import { Button, IconButton, buttonClass } from '../ui/Button';
import { ConfirmDialog, Dialog } from '../ui/Dialog';
import { Field, Select, TextArea, TextInput } from '../ui/Field';

type Tab = 'boards' | 'tasks';
type StatusFilter = 'all' | 'pending' | 'completed';

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <ProjectView key={id} projectId={id} />;
}

function ProjectView({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>('boards');

  // Board creation
  const [creating, setCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const formId = useId();

  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState<BoardSummary | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  usePageTitle(project?.name);

  // Boards in a project are created and deleted by its owner; editors work on the tasks.
  const isOwner = project?.role === 'OWNER';
  const canEditTasks = project?.role !== 'VIEWER';

  useEffect(() => {
    api.projects
      .get(projectId)
      .then(({ project, boards }) => {
        setProject(project);
        setBoards(boards);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(err instanceof ApiError ? err.message : 'This project could not be loaded. Reload the page to try again.');
      });
  }, [projectId]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const { board } = await api.boards.create(newBoardName.trim(), projectId);
      navigate(`/board/${board.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'The board was not created. Try again.');
      setSubmitting(false);
    }
  };

  const confirmDeleteBoard = async () => {
    if (!deletingBoard) return;
    setDeleteBusy(true);
    try {
      await api.boards.remove(deletingBoard.id);
      setBoards((prev) => prev?.filter((b) => b.id !== deletingBoard.id) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The board could not be deleted. Try again.');
    } finally {
      setDeleteBusy(false);
      setDeletingBoard(null);
    }
  };

  const openNewBoard = () => {
    setFormError(null);
    setNewBoardName('');
    setCreating(true);
  };

  if (notFound) {
    return (
      <div className="min-h-dvh bg-paper">
        <Header />
        <main className="mx-auto w-full max-w-xl px-4 pt-16 md:px-8">
          <h1 className="font-serif text-2xl font-semibold">This project is not available</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            It may have been deleted, or it has not been shared with you.
          </p>
          <Link to="/" className={buttonClass('primary', 'md', 'mt-6')}>
            Back to your projects
          </Link>
        </main>
      </div>
    );
  }

  if (!project && !error) return <FullScreenLoader />;

  return (
    <div className="min-h-dvh bg-paper">
      <Header crumbs={project ? [{ label: project.name }] : []} />

      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-20 md:px-8 md:pt-8">
        {project && (
          <PageHead
            title={
              <span className="flex items-start gap-3">
                <Spine color={project.color} className="mt-[0.3em] h-[0.9em] w-2" />
                <span className="min-w-0">{project.name}</span>
              </span>
            }
            lead={
              <>
                {project.description && <p className="max-w-2xl leading-relaxed">{project.description}</p>}
                {!isOwner && (
                  <p className={project.description ? 'mt-1' : ''}>
                    Shared with you. {project.role === 'VIEWER' ? 'You can view it.' : 'You can edit its tasks.'}
                  </p>
                )}
              </>
            }
            actions={
              isOwner && (
                <>
                  <IconButton label="Project settings" tone="boxed" onClick={() => setShowSettings(true)}>
                    <Settings className="h-4 w-4" />
                  </IconButton>
                  <Button icon={<UserPlus className="h-4 w-4" aria-hidden />} onClick={() => setShowShare(true)}>
                    Share
                  </Button>
                  <Button variant="primary" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={openNewBoard}>
                    New board
                  </Button>
                </>
              )
            }
          />
        )}

        {error && <Notice className="mt-4">{error}</Notice>}

        {project && (
          <>
            <Tabs
              label="Project sections"
              className="mt-4"
              value={tab}
              onChange={setTab}
              tabs={[
                { value: 'boards', label: boards ? `Boards (${boards.length})` : 'Boards' },
                { value: 'tasks', label: 'All tasks' },
              ]}
            />

            {tab === 'boards' ? (
              <BoardsTab boards={boards} isOwner={!!isOwner} onNew={openNewBoard} onDelete={setDeletingBoard} />
            ) : (
              <TasksTab projectId={projectId} canEdit={canEditTasks} onError={setError} />
            )}
          </>
        )}
      </main>

      {creating && (
        <Dialog
          title="New board"
          onClose={() => !submitting && setCreating(false)}
          footer={
            <>
              <Button onClick={() => setCreating(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" form={formId} variant="primary" loading={submitting} disabled={!newBoardName.trim()}>
                Create board
              </Button>
            </>
          }
        >
          <form id={formId} onSubmit={handleCreateBoard} className="flex flex-col gap-4">
            {formError && <Notice>{formError}</Notice>}
            <Field label="Board name" hint="Usually the meeting it comes from.">
              {(id) => (
                <TextInput
                  id={id}
                  data-autofocus=""
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Client call, 6 October"
                  maxLength={120}
                  disabled={submitting}
                />
              )}
            </Field>
          </form>
        </Dialog>
      )}

      {showSettings && project && (
        <SettingsDialog
          project={project}
          boardCount={boards?.length ?? 0}
          onClose={() => setShowSettings(false)}
          onUpdated={setProject}
          onDeleted={() => navigate('/')}
        />
      )}

      {showShare && project && isOwner && (
        <ShareDialog kind="project" id={project.id} name={project.name} onClose={() => setShowShare(false)} />
      )}

      {deletingBoard && (
        <ConfirmDialog
          title={`Delete “${deletingBoard.name}”?`}
          confirmLabel="Delete board"
          destructive
          busy={deleteBusy}
          onConfirm={confirmDeleteBoard}
          onCancel={() => setDeletingBoard(null)}
        >
          The board, its tasks, its minutes and its discussion are removed for everyone. This cannot be undone.
        </ConfirmDialog>
      )}
    </div>
  );
}

// --- Boards tab -------------------------------------------------------------

interface BoardsTabProps {
  boards: BoardSummary[] | null;
  isOwner: boolean;
  onNew: () => void;
  onDelete: (board: BoardSummary) => void;
}

function BoardsTab({ boards, isOwner, onNew, onDelete }: BoardsTabProps) {
  if (boards === null) {
    return (
      <p className="py-10 text-sm text-ink-3" role="status">
        Loading boards
      </p>
    );
  }
  if (boards.length === 0) {
    return (
      <div className="mt-6">
        <EmptyPage
          title="No boards in this project yet"
          actions={
            isOwner && (
              <Button size="sm" variant="primary" onClick={onNew}>
                New board
              </Button>
            )
          }
        >
          {isOwner
            ? 'Add a board for each call or meeting. Paste its transcript and the tasks are written for you.'
            : 'The owner has not added a board yet. Boards appear here as they are created.'}
        </EmptyPage>
      </div>
    );
  }
  return (
    <ul>
      {boards.map((board) => (
        <li key={board.id} className="relative flex items-center gap-4 border-b border-rule py-3 pl-1 transition-colors duration-150 hover:bg-wash">
          <div className="min-w-0 flex-1">
            <Link to={`/board/${board.id}`} className="text-[0.9375rem] font-medium after:absolute after:inset-0">
              {board.name}
            </Link>
            <p className="mt-0.5 text-[0.8125rem] text-ink-3">
              {!board.hasAnalysis && board.itemCount === 0
                ? 'No minutes yet'
                : `${count(board.itemCount, 'task')}, ${count(board.memberCount, 'person', 'people')}`}
              <span className="sm:hidden">, {timeAgo(board.updatedAt)}</span>
            </p>
          </div>
          <span className="hidden w-24 shrink-0 text-right text-sm text-ink-3 sm:block">{timeAgo(board.updatedAt)}</span>
          {isOwner ? (
            <IconButton label={`Delete ${board.name}`} tone="remove" onClick={() => onDelete(board)} className="relative z-10">
              <Trash2 className="h-4 w-4" />
            </IconButton>
          ) : (
            <span className="w-1 shrink-0" aria-hidden />
          )}
        </li>
      ))}
    </ul>
  );
}

// --- All-tasks rollup tab ---------------------------------------------------

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Open' },
  { value: 'completed', label: 'Done' },
];

function TasksTab({ projectId, canEdit, onError }: { projectId: string; canEdit: boolean; onError: (m: string) => void }) {
  const [tasks, setTasks] = useState<RollupTask[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [assignee, setAssignee] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.projects
      .tasks(projectId)
      .then(({ tasks }) => setTasks(tasks))
      .catch((err) => onError(err instanceof ApiError ? err.message : 'The tasks could not be loaded. Reload the page to try again.'));
  }, [projectId, onError]);

  const assignees = useMemo(() => Array.from(new Set((tasks ?? []).map((t) => t.assignee))).sort(), [tasks]);

  const filtered = useMemo(
    () =>
      (tasks ?? []).filter(
        (t) => (statusFilter === 'all' || t.status === statusFilter) && (assignee === 'all' || t.assignee === assignee),
      ),
    [tasks, statusFilter, assignee],
  );

  const open = (tasks ?? []).filter((t) => t.status === 'pending').length;

  const toggle = async (task: RollupTask, done: boolean) => {
    const next = done ? 'completed' : 'pending';
    setBusyId(task.id);
    setTasks((prev) => prev?.map((t) => (t.id === task.id ? { ...t, status: next } : t)) ?? null); // optimistic
    try {
      await api.boards.updateItem(task.boardId, task.id, { status: next });
    } catch (err) {
      setTasks((prev) => prev?.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)) ?? null);
      onError(err instanceof ApiError ? err.message : 'That change was not saved. Try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (tasks === null) {
    return (
      <p className="py-10 text-sm text-ink-3" role="status">
        Loading tasks
      </p>
    );
  }
  if (tasks.length === 0) {
    return (
      <div className="mt-6">
        <EmptyPage title="No tasks yet">
          Tasks from every board in this project are gathered here, so one list shows who owns what across all its meetings.
        </EmptyPage>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <Segmented label="Show" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
        <Select aria-label="Owner" controlSize="sm" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="max-w-[13rem]">
          <option value="all">Everyone</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <p className="ml-auto text-[0.8125rem] text-ink-2">
          <span className="font-semibold text-ink tabular-nums">{open}</span> open of{' '}
          <span className="tabular-nums">{tasks.length}</span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="border-t border-ink py-6 text-sm text-ink-2">No task fits these filters.</p>
      ) : (
        <ul className="border-t border-ink">
          {filtered.map((task) => {
            const done = task.status === 'completed';
            const due = dueInfo(task.dueDate);
            const overdue = due.state === 'overdue' && !done;
            return (
              <li key={task.id} className="relative flex items-start gap-3 border-b border-rule py-2.5 pl-1 transition-colors duration-150 hover:bg-wash">
                <span className="relative z-10 mt-px">
                  <Checkbox
                    checked={done}
                    disabled={!canEdit || busyId === task.id}
                    label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                    onChange={(next) => toggle(task, next)}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={`/board/${task.boardId}`} className="text-sm leading-snug font-medium after:absolute after:inset-0">
                    <span className="strike" data-done={done}>
                      {task.title}
                    </span>
                  </Link>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-3">
                    <span>{task.boardName}</span>
                    <span className="md:hidden">{task.assignee}</span>
                  </p>
                </div>
                {/* The date keeps one column, so it reads straight down the list. */}
                <span
                  className={`mt-0.5 w-14 shrink-0 text-right text-xs whitespace-nowrap tabular-nums ${
                    overdue ? 'font-semibold text-red' : 'text-ink-2'
                  }`}
                >
                  {due.short && (
                    <>
                      <span aria-hidden title={duePhrase(due, done)}>
                        {due.short}
                      </span>
                      <span className="sr-only">{duePhrase(due, done)}</span>
                    </>
                  )}
                </span>
                <span className="mt-1 shrink-0 text-ink">
                  <PriorityMark priority={task.priority} />
                </span>
                <span className="hidden w-40 shrink-0 items-center gap-2 text-[0.8125rem] text-ink-2 md:flex">
                  <Initials name={task.assignee} size="sm" />
                  <span className="truncate">{task.assignee}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

// --- Settings ---------------------------------------------------------------

interface SettingsDialogProps {
  project: Project;
  boardCount: number;
  onClose: () => void;
  onUpdated: (p: Project) => void;
  onDeleted: () => void;
}

function SettingsDialog({ project, boardCount, onClose, onUpdated, onDeleted }: SettingsDialogProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [color, setColor] = useState<ProjectColor>(project.color);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const formId = useId();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
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
      setErr(e2 instanceof ApiError ? e2.message : 'Your changes were not saved. Try again.');
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
      setConfirming(false);
    }
  };

  return (
    <Dialog
      title="Project settings"
      onClose={() => !saving && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={saving} disabled={!name.trim()}>
            Save changes
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={save} className="flex flex-col gap-4">
        {err && <Notice>{err}</Notice>}
        <Field label="Project name">
          {(id) => <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} disabled={saving} />}
        </Field>
        <Field label="Description" optional>
          {(id) => (
            <TextArea id={id} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} disabled={saving} className="resize-none" />
          )}
        </Field>
        <div>
          <p className="mb-1.5 text-[0.8125rem] font-medium">Colour</p>
          <ColorPicker value={color} onChange={setColor} />
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-rule pt-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Delete this project</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-3">
            {boardCount > 0
              ? `Delete its ${count(boardCount, 'board')} first. A project with boards cannot be deleted.`
              : 'It has no boards, so it can be deleted.'}
          </p>
        </div>
        <Button variant="danger" disabled={boardCount > 0 || saving} onClick={() => setConfirming(true)}>
          Delete
        </Button>
      </div>

      {confirming && (
        <ConfirmDialog
          title={`Delete “${project.name}”?`}
          confirmLabel="Delete project"
          destructive
          busy={deleting}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        >
          The project is removed for everyone it is shared with. This cannot be undone.
        </ConfirmDialog>
      )}
    </Dialog>
  );
}
