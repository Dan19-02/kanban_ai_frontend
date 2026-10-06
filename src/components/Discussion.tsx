import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { Comment } from '../types';
import { stamp } from '../lib/format';
import { renderMentions } from '../lib/mentions';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { MentionInput } from './MentionInput';

interface DiscussionProps {
  comments: Comment[];
  canEdit: boolean;
  /** Names available for @mention autocomplete and highlighting. */
  people: string[];
  onAdd: (text: string) => void;
  onClose: () => void;
}

/** The board-level conversation, docked beside the board. Each task has its own. */
export function Discussion({ comments, canEdit, people, onAdd, onClose }: DiscussionProps) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Open on the latest message, and follow new ones as they arrive.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [comments.length]);

  const submit = () => {
    const body = text.trim();
    if (!body || !canEdit) return;
    onAdd(body);
    setText('');
  };

  return (
    <Dialog
      variant="sheet"
      title="Discussion"
      onClose={onClose}
      footer={
        canEdit ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex w-full items-center gap-2"
          >
            <MentionInput
              label="Message to the board"
              value={text}
              onChange={setText}
              onSubmit={submit}
              people={people}
              placeholder="Message, or @ to mention someone"
            />
            <Button type="submit" variant="primary" square disabled={!text.trim()} aria-label="Send message">
              <Send className="h-4 w-4" aria-hidden />
            </Button>
          </form>
        ) : (
          <p className="mr-auto text-sm text-ink-3">You have view access, so you can read but not post.</p>
        )
      }
    >
      {comments.length === 0 ? (
        <p className="text-sm leading-relaxed text-ink-2">
          No messages yet. Use this for anything about the meeting as a whole. Each task has its own discussion.
        </p>
      ) : (
        <ol>
          {comments.map((c) => (
            <li key={c.id} className="border-b border-rule py-2.5 first:pt-0">
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
      <div ref={endRef} />
    </Dialog>
  );
}
