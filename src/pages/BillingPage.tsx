import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { UsageMeter } from '../components/UsageMeter';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { usePageTitle } from '../lib/title';
import type { PlanCatalogItem, SubscriptionInfo, Plan } from '../types';
import { Notice, PageHead } from '../ui/bits';
import { Button } from '../ui/Button';

const PLAN_ORDER: Record<Plan, number> = { FREE: 0, STARTER: 1, PRO: 2, UNLIMITED: 3 };

export function BillingPage() {
  const { refreshUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const [plans, setPlans] = useState<PlanCatalogItem[] | null>(null);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const checkoutStatus = params.get('status'); // 'success' | 'cancel' | null

  usePageTitle('Plans and billing');

  const load = () => {
    Promise.all([api.billing.plans(), api.billing.subscription()])
      .then(([p, s]) => {
        setPlans(p.plans);
        setSub(s);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Plans could not be loaded. Reload the page to try again.'));
  };

  useEffect(load, []);

  // After returning from checkout, refresh plan and usage (the confirmation can lag a moment).
  useEffect(() => {
    if (checkoutStatus === 'success') {
      refreshUser();
      const t = setTimeout(load, 2500);
      return () => clearTimeout(t);
    }
  }, [checkoutStatus, refreshUser]);

  const upgrade = async (plan: Plan) => {
    if (plan === 'FREE') return;
    setBusyPlan(plan);
    setError(null);
    try {
      const { url } = await api.billing.checkout(plan as Exclude<Plan, 'FREE'>);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Checkout did not start. Try again.');
      setBusyPlan(null);
    }
  };

  const manage = async () => {
    setBusyPlan('__manage__');
    setError(null);
    try {
      const { url } = await api.billing.portal();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The billing portal did not open. Try again.');
      setBusyPlan(null);
    }
  };

  const currentPlan = sub?.plan ?? 'FREE';
  const dismiss = () => setParams({}, { replace: true });

  return (
    <div className="min-h-dvh bg-paper">
      <Header crumbs={[{ label: 'Plans and billing' }]} />
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-20 md:px-8 md:pt-8">
        <PageHead title="Plans and billing" lead="A transcription is one AI reading of a meeting transcript." />

        {sub && (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-rule py-3">
            <UsageMeter usage={sub.usage} plan={sub.plan} />
            {sub.canManage && (
              <Button loading={busyPlan === '__manage__'} onClick={manage}>
                Manage subscription
              </Button>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 empty:hidden">
          {checkoutStatus === 'success' && (
            <Notice tone="success">
              Your subscription is confirmed. The new plan can take a few seconds to show here.{' '}
              <button type="button" className="link" onClick={dismiss}>
                Dismiss
              </button>
            </Notice>
          )}
          {checkoutStatus === 'cancel' && (
            <Notice tone="info">
              Checkout was cancelled and nothing was charged.{' '}
              <button type="button" className="link" onClick={dismiss}>
                Dismiss
              </button>
            </Notice>
          )}
          {error && <Notice>{error}</Notice>}
          {sub && !sub.billingEnabled && (
            <Notice tone="info">Payments are not set up on this server yet, so paid plans cannot be bought here.</Notice>
          )}
        </div>

        {plans === null ? (
          !error && (
            <p className="py-10 text-sm text-ink-3" role="status">
              Loading plans
            </p>
          )
        ) : (
          <div className="mt-8 grid grid-cols-1 border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isDowngrade = PLAN_ORDER[plan.id] < PLAN_ORDER[currentPlan];
              return (
                <section
                  key={plan.id}
                  aria-label={`${plan.name} plan`}
                  className="flex flex-col border-b border-rule px-1 py-5 sm:px-5 sm:first:pl-1 lg:border-r lg:last:border-r-0"
                >
                  <h2 className="font-serif text-lg font-semibold">
                    {plan.name}
                    {isCurrent && <span className="ml-2 font-sans text-xs font-medium text-ink-2">Your plan</span>}
                  </h2>
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-serif text-[2rem] leading-none font-semibold tabular-nums">${plan.priceUsd}</span>
                    <span className="text-sm text-ink-3">{plan.interval === 'month' ? 'per month' : 'no charge'}</span>
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">
                    {plan.limit === null
                      ? 'Unlimited transcriptions.'
                      : plan.interval === 'month'
                        ? `${plan.limit} transcriptions each month.`
                        : `${plan.limit} transcriptions in total, to try it out.`}
                  </p>

                  <div className="mt-6 pt-1 sm:mt-auto sm:pt-8">
                    {isCurrent ? (
                      <p className="flex h-9 items-center text-sm text-ink-3">You are on this plan</p>
                    ) : plan.id === 'FREE' || isDowngrade ? (
                      sub?.canManage ? (
                        <Button className="w-full" loading={busyPlan === '__manage__'} onClick={manage}>
                          Switch in billing portal
                        </Button>
                      ) : (
                        <p className="flex h-9 items-center text-sm text-ink-3">Included with every account</p>
                      )
                    ) : (
                      <Button
                        variant="primary"
                        className="w-full"
                        loading={busyPlan === plan.id}
                        disabled={!plan.purchasable}
                        onClick={() => upgrade(plan.id)}
                      >
                        {currentPlan === 'FREE' ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                      </Button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
