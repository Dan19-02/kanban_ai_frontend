import React, { useId, useState } from 'react';
import { Alert, Button, Field, Input } from './ui';

interface SetNameModalProps {
  boardName: string;
  defaultName: string;
  onSubmit: (name: string) => Promise<void>;
}

/**
 * Blocking prompt shown when a member opens a board without a chosen display
 * name. The name is what teammates see on comments and presence. It has no
 * close button and ignores Escape on purpose, so it carries the Dialog shell
 * by hand instead of using Dialog.
 */
export function SetNameModal({ boardName, defaultName, onSubmit }: SetNameModalProps) {
  const titleId = useId();
  const [name, setName] = useState(defaultName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
    } catch {
      setError('Your name could not be saved. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-scrim p-0 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-t-xl bg-paper px-5 pb-5 pt-4 shadow-pop sm:rounded-xl"
      >
        <h2 id={titleId} className="text-title font-semibold tracking-[-0.01em] text-ink">Choose your name</h2>
        <p className="mt-1 text-ui text-ink-2">
          This is how teammates see you on{' '}
          <span className="font-medium text-ink">{boardName}</span>, in comments and in the list of who is here.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Your name">
            {(p) => (
              <Input
                {...p}
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Danish K."
                disabled={submitting}
              />
            )}
          </Field>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" busy={submitting} disabled={!name.trim()}>
              Join board
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
