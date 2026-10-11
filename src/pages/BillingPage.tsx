import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { UsageMeter } from '../components/UsageMeter';
import { Alert, Button, PageLoading } from '../components/ui';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { PlanCatalogItem, SubscriptionInfo, Plan } from '../types';

const PLAN_ORDER: Record<Plan, number> = { FREE: 0, STARTER: 1, PRO: 2, UNLIMITED: 3 };

function priceLabel(plan: PlanCatalogItem): string {
  if (plan.priceUsd === 0) return 'Free';
  return plan.interval === 'month' ? `$${plan.priceUsd} a month` : `$${plan.priceUsd} once`;
}

function allowanceLabel(plan: PlanCatalogItem): string {
  if (plan.limit === null) return 'Unlimited transcriptions';
  return plan.interval === 'month' ? `${plan.limit} transcriptions a month` : `${plan.limit} transcriptions in total`;
}

export function BillingPage() {
  const { refreshUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const [plans, setPlans] = useState<PlanCatalogItem[] | null>(null);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const checkoutStatus = params.get('status'); // 'success' | 'cancel' | null

  const load = () => {
    Promise.all([api.billing.plans(), api.billing.subscription()])
      .then(([p, s]) => {
        setPlans(p.plans);
        setSub(s);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Plans and billing could not be loaded. Reload the page to try again.'));
  };

  useEffect(load, []);

  // After returning from Stripe Checkout, refresh plan/usage (webhook may lag).
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
      setError(err instanceof ApiError ? err.message : 'Checkout could not be started. Try again.');
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
      setError(err instanceof ApiError ? err.message : 'The billing portal could not be opened. Try again.');
      setBusyPlan(null);
    }
  };

  const currentPlan = sub?.plan ?? 'FREE';
  const currentName = plans?.find((p) => p.id === currentPlan)?.name ?? currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase();
  const dismissStatus = () => setParams({}, { replace: true });

  // The one ink button goes to the cheapest plan above the current one.
  const nextPlanId = plans
    ?.filter((p) => PLAN_ORDER[p.id] > PLAN_ORDER[currentPlan])
    .sort((a, b) => a.priceUsd - b.priceUsd)[0]?.id;

  return (
    <AppShell crumbs={[{ label: 'Home', to: '/' }, { label: 'Plans and billing' }]}>
      <div className="mx-auto w-full max-w-[760px] px-5 py-10 lg:px-8">
        <h1 className="text-display font-semibold tracking-[-0.02em] text-ink">Plans and billing</h1>
        <p className="mt-2 text-body text-ink-2">
          A transcription is one AI analysis of a meeting transcript. Each one produces a board.
        </p>

        {(checkoutStatus === 'success' || checkoutStatus === 'cancel' || error || (sub && !sub.billingEnabled)) && (
          <div className="mt-6 flex flex-col gap-2">
            {checkoutStatus === 'success' && (
              <Alert tone="neutral" onDismiss={dismissStatus}>
                <span className="font-medium text-ink">Subscription active.</span>{' '}
                Your plan is being switched on. It can take a few seconds to show here.
              </Alert>
            )}
            {checkoutStatus === 'cancel' && (
              <Alert tone="neutral" onDismiss={dismissStatus}>
                Checkout cancelled. No charge was made.
              </Alert>
            )}
            {error && <Alert>{error}</Alert>}
            {sub && !sub.billingEnabled && (
              <Alert tone="neutral">
                Payments are not set up on this server yet, so upgrades are turned off.
              </Alert>
            )}
          </div>
        )}

        {/* Current usage */}
        {sub && (
          <section className="mt-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-[240px] flex-1">
              <p className="mb-1 text-ui text-ink-2">
                You are on the <span className="font-medium text-ink">{currentName}</span> plan.
              </p>
              <UsageMeter usage={sub.usage} plan={sub.plan} />
            </div>
            {sub.canManage && (
              <Button onClick={manage} busy={busyPlan === '__manage__'}>
                Manage subscription
              </Button>
            )}
          </section>
        )}

        {/* Plans */}
        {plans === null ? (
          !error && <PageLoading />
        ) : (
          <section className="mt-12">
            <h2 className="mb-3 text-title font-semibold tracking-[-0.01em] text-ink">Plans</h2>
            <ul className="border-t border-line">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlan;
                const isDowngrade = PLAN_ORDER[plan.id] < PLAN_ORDER[currentPlan];
                return (
                  <li
                    key={plan.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-line py-3 sm:grid-cols-[minmax(0,1fr)_6.5rem_11.5rem_8.5rem]"
                  >
                    <div className="min-w-0">
                      <h3 className="text-body font-medium text-ink">{plan.name}</h3>
                      <p className="text-ui text-ink-2">{plan.tagline}</p>
                    </div>
                    <p className="tnum text-ui text-ink">{priceLabel(plan)}</p>
                    <p className="tnum col-span-2 text-ui text-ink-2 sm:col-span-1">{allowanceLabel(plan)}</p>
                    <div className="col-span-2 mt-2 sm:col-span-1 sm:mt-0 sm:text-right">
                      {isCurrent ? (
                        <span className="text-ui text-ink-2">Current plan</span>
                      ) : plan.id === 'FREE' || isDowngrade ? (
                        // Moving down happens in the Stripe portal, not through checkout.
                        sub?.canManage ? (
                          <Button
                            onClick={manage}
                            disabled={busyPlan === '__manage__'}
                            aria-label={`Switch to ${plan.name} in the billing portal`}
                          >
                            Switch in portal
                          </Button>
                        ) : (
                          <span className="text-ui text-ink-3">Included</span>
                        )
                      ) : (
                        <Button
                          variant={plan.id === nextPlanId ? 'primary' : 'secondary'}
                          onClick={() => upgrade(plan.id)}
                          disabled={!plan.purchasable}
                          busy={busyPlan === plan.id}
                          aria-label={`${currentPlan === 'FREE' ? 'Upgrade' : 'Switch'} to ${plan.name}`}
                        >
                          {currentPlan === 'FREE' ? 'Upgrade' : 'Switch'}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
