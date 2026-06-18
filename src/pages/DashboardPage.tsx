import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Loader2, KanbanSquare, Trash2, Users, ListChecks, Sparkles, X, AlertCircle, Zap,
} from 'lucide-react';
import { Header } from '../components/Header';
import { UsageMeter } from '../components/UsageMeter';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../api/client';
import type { BoardSummary } from '../types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const roleBadge: Record<string, string> = {
  OWNER: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  EDITOR: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  VIEWER: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boards, setBoards] = useState<BoardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.boards
      .list()
      .then(({ boards }) => setBoards(boards))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load boards'));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { board } = await api.boards.create(newName.trim());
      navigate(`/board/${board.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create board');
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, board: BoardSummary) => {
    e.stopPropagation();
    if (!confirm(`Delete "${board.name}"? This cannot be undone.`)) return;
    try {
      await api.boards.remove(board.id);
      setBoards((prev) => prev?.filter((b) => b.id !== board.id) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete board');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors">
      <Header
        actions={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New board</span>
          </button>
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

        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Your boards</h2>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {boards === null ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <KanbanSquare className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">No boards yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Create your first board to turn a transcript into action items.
            </p>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => navigate(`/board/${board.id}`)}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all cursor-pointer flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
                    {board.name}
                  </h3>
                  {board.role === 'OWNER' && (
                    <button
                      onClick={(e) => handleDelete(e, board)}
                      aria-label="Delete board"
                      className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${roleBadge[board.role]}`}>
                    {board.role}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(board.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {creating && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">New board</h3>
              <button
                onClick={() => setCreating(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Board name</span>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Q3 Planning Sync"
                  disabled={submitting}
                  className="mt-1.5 w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
