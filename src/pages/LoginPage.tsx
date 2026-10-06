import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { ApiError } from '../api/client';
import { usePageTitle } from '../lib/title';
import { Notice, WAKING_COPY, useSlow } from '../ui/bits';
import { Button } from '../ui/Button';
import { Field, TextInput } from '../ui/Field';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const slow = useSlow(submitting);
  usePageTitle('Sign in');

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in did not go through. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Turn a meeting transcript into a board of owned tasks."
      footer={
        <>
          New here?{' '}
          <Link to="/register" state={location.state} className="link">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Notice>{error}</Notice>}
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
        <Field label="Password">
          {(id) => (
            <TextInput
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" loading={submitting} className="mt-1 w-full">
          Sign in
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
