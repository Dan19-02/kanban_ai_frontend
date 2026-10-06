import React, { useId, useState } from 'react';
import { Notice } from '../ui/bits';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Field, TextInput } from '../ui/Field';

interface SetNameDialogProps {
  boardName: string;
  defaultName: string;
  onSubmit: (name: string) => Promise<void>;
  /** Carry on under the account name without saving a board-specific one. */
  onSkip: () => void;
}

/**
 * Asked the first time a member opens a board: the name teammates see on their
 * comments and in the list of who is here. It can be skipped, in which case the
 * account name is used.
 */
export function SetNameDialog({ boardName, defaultName, onSubmit, onSkip }: SetNameDialogProps) {
  const [name, setName] = useState(defaultName);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const formId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setFailed(false);
    try {
      await onSubmit(trimmed);
    } catch {
      setFailed(true);
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      title="Your name on this board"
      onClose={onSkip}
      dismissible={false}
      footer={
        <>
          <Button onClick={onSkip} disabled={submitting}>
            Use my account name
          </Button>
          <Button type="submit" form={formId} variant="primary" loading={submitting} disabled={!name.trim()}>
            Join board
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <p className="mb-4 text-sm leading-relaxed text-ink-2">
          Teammates see this next to your comments on <span className="font-medium text-ink">{boardName}</span> and in
          the list of who is here.
        </p>
        <Field label="Display name">
          {(id) => (
            <TextInput
              id={id}
              data-autofocus=""
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoComplete="name"
              disabled={submitting}
            />
          )}
        </Field>
        {failed && (
          <Notice className="mt-3">
            That name could not be saved. Try again, or carry on with your account name.
          </Notice>
        )}
      </form>
    </Dialog>
  );
}
