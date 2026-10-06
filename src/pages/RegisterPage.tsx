import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { ApiError } from '../api/client';
import { usePageTitle } from '../lib/title';
import { Notice, WAKING_COPY, useSlow } from '../ui/bits';
import { Button } from '../ui/Button';
import { Field, TextInput } from '../ui/Field';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Where to go after signing up. Set by ProtectedRoute when an unauthenticated
  // visitor is bounced here from a protected page; defaults to the dashboard.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const slow = useSlow(submitting);
  usePageTitle('Create account');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Choose a password of at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The account was not created. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to start: your first 3 transcriptions are included."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="link">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Notice>{error}</Notice>}
        <Field label="Name" hint="Shown to teammates on tasks and comments.">
          {(id) => (
            <TextInput
              id={id}
              type="text"
              autoComplete="name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          )}
        </Field>
        <Field label="Email">
          {(id) => (
            <TextInput
              id={id}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          )}
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          {(id) => (
            <TextInput
              id={id}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" loading={submitting} className="mt-1 w-full">
          Create account
        </Button>
        {slow && (
          <p className="text-[0.8125rem] leading-relaxed text-ink-2" role="status">
            {WAKING_COPY}
          </p>
        )}
      </form>
    </AuthShell>
  );
}
