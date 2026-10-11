import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { Member, Role } from '../types';
import { Alert, Button, Dialog, Field, Input, Monogram, Select, Spinner } from './ui';

interface ShareModalProps {
  /** What is being shared. Both flows reuse the same member model. */
  kind: 'board' | 'project';
  id: string;
  onClose: () => void;
}

const ROLE_LABEL: Record<Role, string> = { OWNER: 'Owner', EDITOR: 'Can edit', VIEWER: 'Can view' };

export function ShareModal({ kind, id, onClose }: ShareModalProps) {
  const { user } = useAuth();
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
      .catch((err) => setError(err instanceof ApiError ? err.message : 'The people list could not be loaded. Close this and try again.'));
  };

  useEffect(loadMembers, [id, kind]);

  const removeMember = async (userId: string) => {
    try {
      await svcRemove(userId);
      setMembers((prev) => prev?.filter((m) => m.userId !== userId) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That person could not be removed. Try again.');
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
      setError(err instanceof ApiError ? err.message : 'That person could not be added. Check the email and try again.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog title={`Share this ${label}`} onClose={onClose} width="max-w-lg">
      <div className="flex flex-col gap-4 pb-2">
        {error && <Alert>{error}</Alert>}

        {/* Add a teammate who already has an account, by email. */}
        <form onSubmit={addByEmail} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Field label="Email">
              {(p) => (
                <Input
                  {...p}
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  disabled={inviting}
                />
              )}
            </Field>
          </div>
          <Select
            aria-label="Access"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Exclude<Role, 'OWNER'>)}
            className="h-9"
          >
            <option value="EDITOR">Can edit</option>
            <option value="VIEWER">Can view</option>
          </Select>
          <Button type="submit" variant="primary" className="h-9" busy={inviting} disabled={!inviteEmail.trim()}>
            Add person
          </Button>
        </form>
        {inviteNotice ? (
          <Alert tone="neutral">{inviteNotice}</Alert>
        ) : (
          <p className="-mt-2 text-meta text-ink-2">The person needs a TranscribeBoard account already.</p>
        )}

        {/* Members */}
        <section>
          <h3 className="text-ui font-semibold text-ink">People with access</h3>
          {members === null ? (
            !error && (
              <div className="flex justify-center py-6 text-ink-3">
                <Spinner className="h-4 w-4" />
              </div>
            )
          ) : (
            <ul className="mt-1">
              {members.map((m) => (
                <li key={m.userId} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                  <Monogram name={m.name} mine={m.userId === user?.id} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2 text-ui text-ink">
                      <span className="truncate font-medium">{m.name}</span>
                      {m.pending && <span className="shrink-0 text-meta text-ink-3">Invited</span>}
                    </p>
                    <p className="truncate text-meta text-ink-2">{m.email}</p>
                  </div>
                  <span className="shrink-0 text-ui text-ink-2">{ROLE_LABEL[m.role]}</span>
                  {m.role !== 'OWNER' && (
                    <Button variant="ghost" size="sm" onClick={() => removeMember(m.userId)} aria-label={`Remove ${m.name}`}>
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Dialog>
  );
}
