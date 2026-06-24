import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Plus, Loader2, KanbanSquare, Trash2, Users, ListChecks, Sparkles, X, AlertCircle,
  ArrowLeft, Settings, LayoutGrid, ClipboardList, CheckCircle2, Circle, Calendar, User,
  Share2, Eye,
} from 'lucide-react';
import { Header } from '../components/Header';
import { ShareModal } from '../components/ShareModal';
import { api, ApiError } from '../api/client';
import type { BoardSummary, Project, ProjectColor, RollupTask } from '../types';
import { colorClasses, PROJECT_COLORS } from '../lib/projectColors';
import { timeAgo } from '../lib/time';

type Tab = 'boards' | 'tasks';
type StatusFilter = 'all' | 'pending' | 'completed';

const priorityBadge: Record<string, string> = {
  High: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  Medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  Low: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <ProjectView projectId={id} />;
}

function ProjectView({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>('boards');

  // Board creation
  const [creating, setCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Settings & sharing
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const isOwner = project?.role === 'OWNER';
  const canEdit = project?.role !== 'VIEWER'; // owner or editor

  const loadProject = () => {
    api.projects
      .get(projectId)
      .then(({ project, boards }) => {
        setProject(project);
        setBoards(boards);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(err instanceof ApiError ? err.message : 'Failed to load project');
      });
  };

  // If arriving via an invite link (?token=…), join first, then load.
  useEffect(() => {
    const token = searchParams.get('token');
    let cancelled = false;
    (async () => {
      if (token) {
        try {
          await api.projects.join(token);
        } catch {
          /* invalid/expired link — fall through and let the load 404 if needed */
        }
        if (cancelled) return;
        setSearchParams({}, { replace: true });
      }
      if (!cancelled) loadProject();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { board } = await api.boards.create(newBoardName.trim(), projectId);
      navigate(`/board/${board.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create board');
      setSubmitting(false);
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, board: BoardSummary) => {
    e.stopPropagation();
    if (!confirm(`Delete "${board.name}"? This cannot be undone.`)) return;
    try {
      await api.boards.remove(board.id);
      setBoards((prev) => prev?.filter((b) => b.id !== board.id) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete board');
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mb-3" />
        <p className="font-semibold text-slate-900 dark:text-slate-100">Project not found</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
          It may have been deleted, or you don’t have access.
        </p>
        <Link to="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700">
          Back to projects
        </Link>
      </div>
    );
  }

  const c = project ? colorClasses(project.color) : colorClasses('indigo');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors">
      <Header
        center={
          project && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[160px] sm:max-w-xs">
                {project.name}
              </span>
            </div>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            {project && isOwner && (
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            {tab === 'boards' && canEdit && (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New board</span>
              </button>
            )}
          </div>
        }
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All projects
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              {project && <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.soft}`}>
                <KanbanSquare className={`w-5 h-5 ${c.text}`} />
              </span>}
              {project?.name ?? '…'}
            </h1>
            {project?.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl">{project.description}</p>
            )}
          </div>
          {project && (isOwner ? (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
              aria-label="Project settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
              {project.role === 'VIEWER' ? <><Eye className="w-3 h-3" /> View only</> : 'Editor'}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 mb-6">
          <TabButton active={tab === 'boards'} onClick={() => setTab('boards')} icon={<LayoutGrid className="w-4 h-4" />}>
            Boards{boards ? ` (${boards.length})` : ''}
          </TabButton>
          <TabButton active={tab === 'tasks'} onClick={() => setTab('tasks')} icon={<ClipboardList className="w-4 h-4" />}>
            All tasks
          </TabButton>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {tab === 'boards' ? (
          <BoardsTab
            boards={boards}
            canCreate={canEdit}
            canDelete={!!isOwner}
            onOpen={(b) => navigate(`/board/${b.id}`)}
            onDelete={handleDeleteBoard}
            onNew={() => setCreating(true)}
          />
        ) : (
          <TasksTab projectId={projectId} canEdit={canEdit} onError={setError} />
        )}
      </main>

      {creating && (
        <Modal title="New board" onClose={() => setCreating(false)}>
          <form onSubmit={handleCreateBoard} className="p-5 flex flex-col gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Board name</span>
              <input
                autoFocus
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="e.g. Mon standup, Client call…"
                disabled={submitting}
                maxLength={120}
                className="mt-1.5 w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting || !newBoardName.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showSettings && project && (
        <SettingsModal
          project={project}
          boardCount={boards?.length ?? 0}
          onClose={() => setShowSettings(false)}
          onUpdated={(p) => setProject(p)}
          onDeleted={() => navigate('/')}
        />
      )}

      {showShare && project && isOwner && (
        <ShareModal
          kind="project"
          id={project.id}
          initialShare={project.share}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

function TabButton({
  active, onClick, icon, children,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// --- Boards tab -------------------------------------------------------------

function BoardsTab({
  boards, canCreate, canDelete, onOpen, onDelete, onNew,
}: {
  boards: BoardSummary[] | null;
  canCreate: boolean;
  canDelete: boolean;
  onOpen: (b: BoardSummary) => void;
  onDelete: (e: React.MouseEvent, b: BoardSummary) => void;
  onNew: () => void;
}) {
  if (boards === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }
  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <KanbanSquare className="w-7 h-7 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">No boards yet</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-sm">
          {canCreate
            ? 'Add a board for each call or meeting — paste its transcript and AI turns it into tasks.'
            : 'There are no boards in this project yet.'}
        </p>
        {canCreate && (
          <button onClick={onNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New board
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {boards.map((board) => (
        <div
          key={board.id}
          onClick={() => onOpen(board)}
          className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer flex flex-col gap-4"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">{board.name}</h3>
            {canDelete && (
            <button
              onClick={(e) => onDelete(e, board)}
              aria-label="Delete board"
              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" /> {board.itemCount}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {board.memberCount}</span>
            {board.hasAnalysis && (
              <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" /> Analyzed
              </span>
            )}
            <span className="ml-auto text-slate-400 dark:text-slate-500">{timeAgo(board.updatedAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- All-tasks rollup tab ---------------------------------------------------

function TasksTab({
  projectId, canEdit, onError,
}: { projectId: string; canEdit: boolean; onError: (m: string) => void }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<RollupTask[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [assignee, setAssignee] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.projects
      .tasks(projectId)
      .then(({ tasks }) => setTasks(tasks))
      .catch((err) => onError(err instanceof ApiError ? err.message : 'Failed to load tasks'));
  }, [projectId, onError]);

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
    } catch (err) {
      // Revert on failure.
      setTasks((prev) => prev?.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)) ?? null);
      onError(err instanceof ApiError ? err.message : 'Failed to update task');
    } finally {
      setBusyId(null);
    }
  };

  if (tasks === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <ClipboardList className="w-7 h-7 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-900 dark:text-slate-100">No tasks yet</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Tasks from every board in this project show up here — your single command center.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat label="Total tasks" value={stats.total} />
        <Stat label="Open" value={stats.open} accent="text-amber-600 dark:text-amber-400" />
        <Stat label="Done" value={stats.done} accent="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-sm">
          {(['all', 'pending', 'completed'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {s === 'pending' ? 'Open' : s === 'completed' ? 'Done' : 'All'}
            </button>
          ))}
        </div>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Everyone</option>
            {assignees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
          {filtered.length} shown
        </span>
      </div>

      {/* Task list */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No tasks match these filters.
          </p>
        ) : (
          filtered.map((task) => {
            const done = task.status === 'completed';
            return (
              <div
                key={task.id}
                onClick={() => navigate(`/board/${task.boardId}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); if (canEdit) toggle(task); }}
                  disabled={busyId === task.id || !canEdit}
                  aria-label={done ? 'Mark as open' : 'Mark as done'}
                  className="shrink-0 disabled:opacity-50 disabled:cursor-default"
                >
                  {busyId === task.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  ) : done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-indigo-500" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1 truncate">
                      <KanbanSquare className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[160px]">{task.boardName}</span>
                    </span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" /> {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>

                {task.priority && (
                  <span className={`hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${priorityBadge[task.priority]}`}>
                    {task.priority}
                  </span>
                )}
                <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 shrink-0 w-32 justify-end truncate">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                    {task.assignee.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate">{task.assignee}</span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <p className={`text-2xl font-bold ${accent ?? 'text-slate-900 dark:text-slate-100'}`}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

// --- Shared modal shell + settings ------------------------------------------

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SettingsModal({
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
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
      setErr(e2 instanceof ApiError ? e2.message : 'Failed to save');
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setErr(null);
    try {
      await api.projects.remove(project.id);
      onDeleted();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  return (
    <Modal title="Project settings" onClose={onClose}>
      <form onSubmit={save} className="p-5 flex flex-col gap-4">
        {err && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-400">{err}</p>
          </div>
        )}
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Project name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            maxLength={120}
            className="mt-1.5 w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            rows={2}
            maxLength={500}
            className="mt-1.5 w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 resize-none"
          />
        </label>
        <div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Colour</span>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {PROJECT_COLORS.map((col) => {
              const cc = colorClasses(col);
              return (
                <button
                  key={col}
                  type="button"
                  aria-label={col}
                  onClick={() => setColor(col)}
                  className={`w-7 h-7 rounded-full ${cc.dot} transition-transform ${
                    color === col ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110' : 'hover:scale-110'
                  }`}
                />
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || !name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </form>

      <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 mt-1">
        <div className="flex items-center justify-between gap-3 pt-4">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Delete project</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {boardCount > 0
                ? `Remove its ${boardCount} ${boardCount === 1 ? 'board' : 'boards'} first.`
                : 'This project is empty and can be deleted.'}
            </p>
          </div>
          <button
            onClick={remove}
            disabled={deleting || boardCount > 0}
            className="px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
