import React, { useEffect, useState } from 'react';
import { X, Check, Loader2, UserMinus, AlertCircle, UserPlus } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { Member, Role } from '../types';

interface ShareModalProps {
  /** What is being shared. Both flows reuse the same member model. */
  kind: 'board' | 'project';
  id: string;
  onClose: () => void;
}

export function ShareModal({ kind, id, onClose }: ShareModalProps) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Exclude<Role, 'OWNER'>>('EDITOR');
  const [inviting, setInviting] = useState(false);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);

  const label = kind === 'project' ? 'project' : 'board';

  // Branch the API by kind; both expose the same member surface.
  const svcMembers = () => (kind === 'project' ? api.projects.members(id) : api.boards.members(id));
  const svcAdd = (email: string, role: Exclude<Role, 'OWNER'>) =>
    kind === 'project' ? api.projects.addMember(id, email, role) : api.boards.addMember(id, email, role);
  const svcRemove = (userId: string) =>
    kind === 'project' ? api.projects.removeMember(id, userId) : api.boards.removeMember(id, userId);

  const loadMembers = () => {
    svcMembers()
      .then(({ members }) => setMembers(members))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load members'));
  };

  useEffect(loadMembers, [id, kind]);

  const removeMember = async (userId: string) => {
    try {
      await svcRemove(userId);
      setMembers((prev) => prev?.filter((m) => m.userId !== userId) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove member');
    }
  };

  const addByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    setError(null);
    setInviteNotice(null);
    try {
      await svcAdd(email, inviteRole);
      setInviteEmail('');
      setInviteNotice(`Added ${email} to the ${label}.`);
      loadMembers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add that person');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 capitalize">
            <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Share {label}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Add a teammate who already has an account, by email. */}
          <section>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Add a person</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Add a teammate who already has an account, by their email.
            </p>
            <form onSubmit={addByEmail} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                disabled={inviting}
                className="flex-1 min-w-0 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Exclude<Role, 'OWNER'>)}
                className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-slate-900 dark:text-slate-100 shrink-0"
              >
                <option value="EDITOR">Can edit</option>
                <option value="VIEWER">Can view</option>
              </select>
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Add
              </button>
            </form>
            {inviteNotice && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> {inviteNotice}
              </p>
            )}
          </section>

          {/* Members */}
          <section className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-4">
              People with access
            </p>
            {members === null ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {m.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                        {m.name}
                        {m.pending && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                            Pending
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.email}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {m.role}
                    </span>
                    {m.role !== 'OWNER' && (
                      <button
                        onClick={() => removeMember(m.userId)}
                        aria-label="Remove member"
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
