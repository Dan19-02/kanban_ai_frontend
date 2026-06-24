import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Loader2, FolderKanban, Trash2, KanbanSquare, ListChecks, X, AlertCircle, Zap,
  Users, Sparkles,
} from 'lucide-react';
import { Header } from '../components/Header';
import { UsageMeter } from '../components/UsageMeter';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../api/client';
import type { BoardSummary, ProjectColor, ProjectSummary } from '../types';
import { colorClasses, PROJECT_COLORS } from '../lib/projectColors';
import { timeAgo } from '../lib/time';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [sharedBoards, setSharedBoards] = useState<BoardSummary[]>([]);
  const [unfiledBoards, setUnfiledBoards] = useState<BoardSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ProjectColor>('indigo');
  const [submitting, setSubmitting] = useState(false);
  // Standalone "new board" (no project) — lower-friction path.
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardSubmitting, setBoardSubmitting] = useState(false);

  const load = () => {
    Promise.all([api.projects.list(), api.boards.list()])
      .then(([{ projects }, { boards }]) => {
        setProjects(projects);
        // Boards shared with me (where I'm not the owner) live outside my projects.
        setSharedBoards(boards.filter((b) => b.role !== 'OWNER'));
        // My own boards not filed under any project ("standalone").
        setUnfiledBoards(boards.filter((b) => b.role === 'OWNER' && b.projectId == null));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load projects'));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { project } = await api.projects.create({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      navigate(`/project/${project.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create project');
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, project: ProjectSummary) => {
    e.stopPropagation();
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.projects.remove(project.id);
      setProjects((prev) => prev?.filter((p) => p.id !== project.id) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete project');
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    setBoardSubmitting(true);
    setError(null);
    try {
      const { board } = await api.boards.create(boardName.trim()); // no project = standalone
      navigate(`/board/${board.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create board');
      setBoardSubmitting(false);
    }
  };

  const handleDeleteBoard = async (e: React.MouseEvent, board: BoardSummary) => {
    e.stopPropagation();
    if (!confirm(`Delete "${board.name}"? This cannot be undone.`)) return;
    try {
      await api.boards.remove(board.id);
      setUnfiledBoards((prev) => prev.filter((b) => b.id !== board.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete board');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors">
      <Header
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreatingBoard(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <KanbanSquare className="w-4 h-4" />
              <span className="hidden sm:inline">New board</span>
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New project</span>
            </button>
          </div>
        }
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {user && !user.usage.unlimited && (
          <div
            className={`mb-6 rounded-xl border p-4 flex items-center gap-4 flex-wrap ${
              user.usage.remaining === 0
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <Zap className={`w-5 h-5 shrink-0 ${user.usage.remaining === 0 ? 'text-amber-500' : 'text-indigo-500'}`} />
            <div className="flex-1 min-w-[220px]">
              {user.usage.remaining === 0 ? (
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {user.plan === 'FREE'
                    ? "You've used all 3 free transcriptions. Upgrade to keep analyzing."
                    : "You've hit your monthly transcription limit. Upgrade for more."}
                </p>
              ) : (
                <UsageMeter usage={user.usage} plan={user.plan} compact />
              )}
            </div>
            <Link
              to="/billing"
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors shrink-0"
            >
              {user.plan === 'FREE' ? 'Upgrade' : 'Manage plan'}
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {projects === null ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : projects.length === 0 && unfiledBoards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <FolderKanban className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Nothing here yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-sm">
              Spin up a single board for a quick meeting, or create a project to group related
              boards and track every task in one place.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCreatingBoard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              >
                <KanbanSquare className="w-4 h-4" /> New board
              </button>
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> New project
              </button>
            </div>
          </div>
        ) : (
          projects.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Your projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const c = colorClasses(project.color);
                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/project/${project.id}`)}
                      className={`group relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 pl-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-4 ${c.ring}`}
                    >
                      <span className={`absolute left-0 top-0 h-full w-1.5 ${c.bar}`} />
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.soft}`}>
                            <FolderKanban className={`w-5 h-5 ${c.text}`} />
                          </div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
                            {project.name}
                          </h3>
                        </div>
                        {project.role === 'OWNER' ? (
                          <button
                            onClick={(e) => handleDelete(e, project)}
                            aria-label="Delete project"
                            className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shrink-0">
                            Shared
                          </span>
                        )}
                      </div>

                      {project.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 -mt-1">
                          {project.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-auto">
                        <span className="flex items-center gap-1">
                          <KanbanSquare className="w-3.5 h-3.5" /> {project.boardCount}{' '}
                          {project.boardCount === 1 ? 'board' : 'boards'}
                        </span>
                        <span className="flex items-center gap-1">
                          <ListChecks className="w-3.5 h-3.5" /> {project.openTaskCount} open
                        </span>
                        <span className="ml-auto text-slate-400 dark:text-slate-500">
                          {timeAgo(project.updatedAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}

        {unfiledBoards.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-12 mb-2">Boards</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Standalone boards that aren&apos;t in a project.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unfiledBoards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
                      {board.name}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteBoard(e, board)}
                      aria-label="Delete board"
                      className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-auto">
                    <span className="flex items-center gap-1">
                      <ListChecks className="w-3.5 h-3.5" /> {board.itemCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {board.memberCount}
                    </span>
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
          </>
        )}

        {sharedBoards.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-12 mb-2">
              Shared with me
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Boards other people have shared with you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedBoards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer flex flex-col gap-4"
                >
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
                    {board.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <ListChecks className="w-3.5 h-3.5" /> {board.itemCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {board.memberCount}
                    </span>
                    {board.hasAnalysis && (
                      <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5" /> Analyzed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      {board.role}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(board.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {creatingBoard && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">New board</h3>
              <button
                onClick={() => setCreatingBoard(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBoard} className="p-5 flex flex-col gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Board name</span>
                <input
                  autoFocus
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="e.g. Mon standup, Client call…"
                  disabled={boardSubmitting}
                  maxLength={120}
                  className="mt-1.5 w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </label>
              <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
                This board won&apos;t be in a project. You can use it on its own.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreatingBoard(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={boardSubmitting || !boardName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {boardSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">New project</h3>
              <button
                onClick={() => setCreating(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Project name</span>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Q3 Rollout"
                  disabled={submitting}
                  maxLength={120}
                  className="mt-1.5 w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description <span className="text-slate-400 font-normal">(optional)</span>
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                  disabled={submitting}
                  rows={2}
                  maxLength={500}
                  className="mt-1.5 w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 resize-none"
                />
              </label>
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Colour</span>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {PROJECT_COLORS.map((col) => {
                    const c = colorClasses(col);
                    return (
                      <button
                        key={col}
                        type="button"
                        aria-label={col}
                        onClick={() => setColor(col)}
                        className={`w-7 h-7 rounded-full ${c.dot} transition-transform ${
                          color === col
                            ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110'
                            : 'hover:scale-110'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
