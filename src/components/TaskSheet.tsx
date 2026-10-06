import React, { useEffect, useRef, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import type { ActionItem, Comment } from '../types';
import { stamp } from '../lib/format';
import { renderMentions } from '../lib/mentions';
import { Checkbox, Initials, Notice } from '../ui/bits';
import { Button } from '../ui/Button';
import { ConfirmDialog, Dialog } from '../ui/Dialog';
import { Select, TextArea, TextInput, controlBase } from '../ui/Field';
import { MentionInput } from './MentionInput';
import type { Waiting } from './TaskRow';

interface TaskSheetProps {
  item: ActionItem;
  number: number;
  waitsOn: (Waiting & { done?: boolean })[];
  canEdit: boolean;
  /** Freshly added: start with the placeholder title selected, ready to replace. */
  isNew?: boolean;
  people: string[];
  loadComments: (itemId: string) => Promise<Comment[]>;
  addComment: (itemId: string, text: string) => Promise<Comment[]>;
  onUpdate: (updates: Partial<ActionItem>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const rowLabel = 'pt-2 text-[0.8125rem] text-ink-3';

/** One task in full, beside the board: its fields save as you leave them. */
export function TaskSheet({
  item,
  number,
  waitsOn,
  canEdit,
  isNew = false,
  people,
  loadComments,
  addComment,
  onUpdate,
  onDelete,
  onClose,
}: TaskSheetProps) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const done = item.status === 'completed';

  useEffect(() => {
    let cancelled = false;
    loadComments(item.id)
      .then((c) => !cancelled && setComments(c))
      .catch(() => {
        if (cancelled) return;
        setComments([]);
        setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [item.id, loadComments]);

  useEffect(() => {
    if (isNew) titleRef.current?.select();
  }, [isNew]);

  const post = async () => {
    const body = text.trim();
    if (!body || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      setComments(await addComment(item.id, body));
      setText('');
    } catch {
      setPostError('That comment was not sent. Try again.');
    } finally {
      setPosting(false);
    }
  };

  const blurOnEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur();
  };

  return (
    <Dialog
      variant="sheet"
      title={<span className="tabular-nums">Task {number}</span>}
      onClose={onClose}
      footer={
        <>
          {canEdit && (
            <Button
              variant="quietDanger"
              icon={<Trash2 className="h-4 w-4" aria-hidden />}
              onClick={() => setConfirmDelete(true)}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      {canEdit ? (
        <div className="-mx-2.5">
          <input
            ref={titleRef}
            data-autofocus={isNew ? '' : undefined}
            aria-label="Task title"
            defaultValue={item.title}
            maxLength={300}
            onBlur={(e) => {
              const next = e.target.value.trim();
              if (next && next !== item.title) onUpdate({ title: next });
              else e.target.value = item.title;
            }}
            onKeyDown={blurOnEnter}
            className={`${controlBase} block w-full border-transparent px-2.5 py-1.5 text-lg leading-snug font-semibold hover:border-rule-2`}
          />
        </div>
      ) : (
        <h3 className="text-lg leading-snug font-semibold">{item.title}</h3>
      )}

      <dl className="mt-4 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 border-y border-rule py-3">
        <dt className={rowLabel}>Status</dt>
        <dd className="flex h-9 items-center gap-2.5 text-sm">
          <Checkbox
            checked={done}
            disabled={!canEdit}
            label={done ? 'Mark as not done' : 'Mark as done'}
            onChange={(next) => onUpdate({ status: next ? 'completed' : 'pending' })}
          />
          <span>{done ? 'Done' : 'Open'}</span>
        </dd>

        <dt className={rowLabel}>Owner</dt>
        <dd>
          {canEdit ? (
            <TextInput
              aria-label="Owner"
              defaultValue={item.assignee}
              maxLength={120}
              placeholder="Unassigned"
              list="task-sheet-people"
              onBlur={(e) => {
                // A task always has an owner name; empty means nobody yet.
                const next = e.target.value.trim() || 'Unassigned';
                if (next !== item.assignee) onUpdate({ assignee: next });
                e.target.value = next;
              }}
              onKeyDown={blurOnEnter}
            />
          ) : (
            <p className="flex h-9 items-center gap-2 text-sm">
              <Initials name={item.assignee} size="sm" />
              {item.assignee}
            </p>
          )}
          <datalist id="task-sheet-people">
            {people.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </dd>

        <dt className={rowLabel}>Due</dt>
        <dd>
          <TextInput
            type="date"
            aria-label="Due date"
            value={item.dueDate || ''}
            disabled={!canEdit}
            onChange={(e) => onUpdate({ dueDate: e.target.value })}
            className="max-w-[11rem]"
          />
        </dd>

        <dt className={rowLabel}>Priority</dt>
        <dd>
          <Select
            aria-label="Priority"
            value={item.priority ?? ''}
            disabled={!canEdit}
            onChange={(e) => {
              const next = e.target.value as ActionItem['priority'] | '';
              if (next) onUpdate({ priority: next });
            }}
            className="max-w-[11rem]"
          >
            {!item.priority && <option value="">Not set</option>}
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </Select>
        </dd>
      </dl>

      <section className="mt-4">
        <h3 className="mb-1.5 font-serif text-[0.9375rem] font-semibold">Description</h3>
        {canEdit ? (
          <TextArea
            aria-label="Description"
            defaultValue={item.description ?? ''}
            maxLength={5000}
            rows={4}
            placeholder="Context, links, what done looks like"
            onBlur={(e) => {
              if (e.target.value !== (item.description ?? '')) onUpdate({ description: e.target.value });
            }}
            className="min-h-24 resize-y"
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-2">
            {item.description || 'No description.'}
          </p>
        )}
      </section>

      {waitsOn.length > 0 && (
        <section className="mt-5">
          <h3 className="mb-1.5 font-serif text-[0.9375rem] font-semibold">Waits on</h3>
          <ul className="border-t border-rule">
            {waitsOn.map((w, i) => (
              <li key={`${w.title}-${i}`} className="grid grid-cols-[2rem_minmax(0,1fr)] border-b border-rule py-2 text-sm">
                <span className="text-xs leading-5 text-ink-3 tabular-nums">{w.number ?? ''}</span>
                <span className={w.done ? 'text-ink-3 line-through' : 'text-ink'}>
                  {w.title}
                  {w.done && <span className="sr-only"> (done)</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5">
        <h3 className="mb-2 font-serif text-[0.9375rem] font-semibold">
          Discussion{' '}
          {comments && comments.length > 0 && (
            <span className="font-sans text-xs font-normal text-ink-3 tabular-nums">{comments.length}</span>
          )}
        </h3>
        {comments === null ? (
          <p className="text-sm text-ink-3" role="status">
            Loading the discussion
          </p>
        ) : loadFailed ? (
          <Notice>The discussion could not be loaded. Close this task and open it again.</Notice>
        ) : comments.length === 0 ? (
          <p className="text-sm text-ink-3">
            {canEdit ? 'Nobody has commented on this task yet.' : 'No comments on this task.'}
          </p>
        ) : (
          <ol className="border-t border-rule">
            {comments.map((c) => (
              <li key={c.id} className="border-b border-rule py-2.5">
                <p className="flex items-baseline gap-2 text-[0.8125rem]">
                  <span className="min-w-0 truncate font-semibold text-ink">{c.author}</span>
                  <time className="shrink-0 text-xs text-ink-3 tabular-nums">{stamp(c.timestamp)}</time>
                </p>
                <p className="mt-0.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-ink-2">
                  {renderMentions(c.text, people)}
                </p>
              </li>
            ))}
          </ol>
        )}

        {canEdit && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              post();
            }}
            className="mt-3 flex items-center gap-2"
          >
            <MentionInput
              label="Comment on this task"
              value={text}
              onChange={setText}
              onSubmit={post}
              people={people}
              disabled={posting}
              placeholder="Comment, or @ to mention someone"
            />
            <Button type="submit" variant="primary" square loading={posting} disabled={!text.trim()} aria-label="Send comment">
              {!posting && <Send className="h-4 w-4" aria-hidden />}
            </Button>
          </form>
        )}
        {postError && <Notice className="mt-2">{postError}</Notice>}
      </section>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this task?"
          confirmLabel="Delete task"
          destructive
          onConfirm={onDelete}
          onCancel={() => setConfirmDelete(false)}
        >
          “{item.title}” and its discussion will be removed from the board for everyone. This cannot be undone.
        </ConfirmDialog>
      )}
    </Dialog>
  );
}
