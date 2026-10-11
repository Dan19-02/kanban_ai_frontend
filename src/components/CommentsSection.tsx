import React, { useEffect, useRef, useState } from 'react';
import { Comment } from '../types';
import { MentionInput } from './MentionInput';
import { renderMentions } from '../lib/mentions';
import { Button, Monogram, cx, inputClass } from './ui';

interface CommentsSectionProps {
  comments: Comment[];
  canEdit: boolean;
  onAddComment: (text: string) => void;
  /** Names available for @mention autocomplete. */
  people?: string[];
  /** Names the signed-in person goes by on this board. */
  me?: string[];
}

/** The board's discussion thread. Sits in the side column, not in a bubble. */
export function CommentsSection({ comments, canEdit, onAddComment, people = [], me }: CommentsSectionProps) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);

  // Keep the newest comment in view as the thread grows.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [comments.length]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || !canEdit) return;
    onAddComment(trimmed);
    setText('');
  };

  return (
    <div className="flex flex-col gap-4">
      {comments.length === 0 ? (
        <p className="text-ui text-ink-2">
          No comments yet. {canEdit ? 'Ask a question or flag something for the team.' : ''}
        </p>
      ) : (
        <ul className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
          {comments.map((c) => {
            const mine = !!me?.includes(c.author);
            return (
              <li key={c.id} className="flex gap-2.5">
                <Monogram name={c.author} mine={mine} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 text-ui">
                    <span className="truncate font-medium text-ink">{c.author}</span>
                    <span className="tnum shrink-0 text-meta text-ink-3">
                      {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-ui leading-relaxed text-ink-2">
                    {renderMentions(c.text, people)}
                  </p>
                </div>
              </li>
            );
          })}
          <div ref={end} />
        </ul>
      )}

      {canEdit ? (
        <form
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col gap-2"
        >
          <MentionInput
            value={text}
            onChange={setText}
            onSubmit={submit}
            people={people}
            placeholder="Write a comment. Type @ to mention"
            className={cx(inputClass, 'h-9')}
          />
          <Button type="submit" variant="secondary" size="sm" className="self-end" disabled={!text.trim()}>
            Send
          </Button>
        </form>
      ) : (
        <p className="text-meta text-ink-3">You can read this board but not comment on it.</p>
      )}
    </div>
  );
}
