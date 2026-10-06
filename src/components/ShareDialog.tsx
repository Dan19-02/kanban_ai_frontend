import React, { useEffect, useState } from 'react';
import { UserMinus } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { Member, Role } from '../types';
import { Initials, Notice } from '../ui/bits';
import { Button, IconButton } from '../ui/Button';
import { ConfirmDialog, Dialog } from '../ui/Dialog';
import { Field, Select, TextInput } from '../ui/Field';

interface ShareDialogProps {
  /** What is being shared. Both flows use the same member model. */
  kind: 'board' | 'project';
  id: string;
  name: string;
  onClose: () => void;
}

type Access = Exclude<Role, 'OWNER'>;

const ROLE_LABEL: Record<Role, string> = { OWNER: 'Owner', EDITOR: 'Can edit', VIEWER: 'Can view' };

export function ShareDialog({ kind, id, name, onClose }: ShareDialogProps) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [access, setAccess] = useState<Access>('EDITOR');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  // Boards and projects expose the same member surface.
  const svc = kind === 'project' ? api.projects : api.boards;

  const loadMembers = () => {
    svc
      .members(id)
      .then(({ members }) => setMembers(members))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'The list of people could not be loaded.'));
  };

  useEffect(loadMembers, [id, kind]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setAdding(true);
    setError(null);
    setAdded(null);
    try {
      await svc.addMember(id, address, access);
      setEmail('');
      setAdded(address);
      loadMembers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That person could not be added. Try again.');
    } finally {
      setAdding(false);
    }
  };

  const remove = async () => {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await svc.removeMember(id, removing.userId);
      setMembers((prev) => prev?.filter((m) => m.userId !== removing.userId) ?? null);
      setRemoving(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That person could not be removed. Try again.');
      setRemoving(null);
    } finally {
      setRemoveBusy(false);
    }
  };

  return (
    <Dialog wide title={`Share “${name}”`} onClose={onClose} footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
      <form onSubmit={add} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_8.5rem_auto] sm:items-end">
        <Field label="Add a teammate by email">
          {(fieldId) => (
            <TextInput
              id={fieldId}
              data-autofocus=""
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              autoComplete="off"
              disabled={adding}
            />
          )}
        </Field>
        <Select aria-label="Access" value={access} onChange={(e) => setAccess(e.target.value as Access)} disabled={adding}>
          <option value="EDITOR">Can edit</option>
          <option value="VIEWER">Can view</option>
        </Select>
        <Button type="submit" variant="primary" loading={adding} disabled={!email.trim()}>
          Add
        </Button>
      </form>
      <p className="mt-1.5 text-xs text-ink-3">
        They need a TranscribeBoard account first.
        {kind === 'project' && ' Sharing a project shares every board in it.'}
      </p>

      {error && <Notice className="mt-3">{error}</Notice>}
      {added && !error && (
        <Notice tone="success" className="mt-3">
          {added} now has access.
        </Notice>
      )}

      <h3 className="mt-6 border-b border-ink pb-2 font-serif text-[0.9375rem] font-semibold">People with access</h3>
      {members === null ? (
        <p className="py-3 text-sm text-ink-3" role="status">
          {error ? 'Close this and open it again to retry.' : 'Loading people'}
        </p>
      ) : (
        <ul>
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 border-b border-rule py-2.5">
              <Initials name={m.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.name}
                  {m.pending && <span className="ml-2 text-xs font-normal text-ink-3">Not opened yet</span>}
                </p>
                <p className="truncate text-xs text-ink-3">{m.email}</p>
              </div>
              <span className="shrink-0 text-[0.8125rem] text-ink-2">{ROLE_LABEL[m.role]}</span>
              {m.role === 'OWNER' ? (
                <span className="w-9 shrink-0" aria-hidden />
              ) : (
                <IconButton label={`Remove ${m.name}`} onClick={() => setRemoving(m)}>
                  <UserMinus className="h-4 w-4" />
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      )}

      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.name}?`}
          confirmLabel="Remove access"
          destructive
          busy={removeBusy}
          onConfirm={remove}
          onCancel={() => setRemoving(null)}
        >
          They lose access to this {kind} straight away. You can add them back at any time.
        </ConfirmDialog>
      )}
    </Dialog>
  );
}
