import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check, Loader2, AlertCircle, Sparkles, CreditCard, Settings, CheckCircle2,
} from 'lucide-react';
import { Header } from '../components/Header';
import { UsageMeter } from '../components/UsageMeter';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { PlanCatalogItem, SubscriptionInfo, Plan } from '../types';

const PLAN_ORDER: Record<Plan, number> = { FREE: 0, STARTER: 1, PRO: 2, UNLIMITED: 3 };

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
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load billing'));
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
      setError(err instanceof ApiError ? err.message : 'Could not start checkout');
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
      setError(err instanceof ApiError ? err.message : 'Could not open billing portal');
      setBusyPlan(null);
    }
  };

  const currentPlan = sub?.plan ?? 'FREE';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Plans & billing</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            A transcription is one AI analysis of a meeting transcript.
          </p>
        </div>

        {checkoutStatus === 'success' && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Subscription active</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Thanks! Your plan is being activated — it may take a few seconds to reflect here.
              </p>
            </div>
            <button onClick={() => setParams({}, { replace: true })} className="ml-auto text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              Dismiss
            </button>
          </div>
        )}
        {checkoutStatus === 'cancel' && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-400">Checkout canceled — no charge was made.</p>
            <button onClick={() => setParams({}, { replace: true })} className="ml-auto text-amber-600 dark:text-amber-400 text-sm font-medium">
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Current usage */}
        {sub && (
          <div className="mb-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-[240px]">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Current plan: <span className="text-indigo-600 dark:text-indigo-400">{sub.plan}</span>
                </p>
                <UsageMeter usage={sub.usage} plan={sub.plan} />
              </div>
              {sub.canManage && (
                <button
                  onClick={manage}
                  disabled={busyPlan === '__manage__'}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  {busyPlan === '__manage__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                  Manage subscription
                </button>
              )}
            </div>
          </div>
        )}

        {sub && !sub.billingEnabled && (
          <div className="mb-6 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Payments aren&apos;t configured on this server yet, so upgrades are disabled.
            </p>
          </div>
        )}

        {/* Plan cards */}
        {plans === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isDowngrade = PLAN_ORDER[plan.id] < PLAN_ORDER[currentPlan];
              const featured = plan.id === 'PRO';
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-5 flex flex-col bg-white dark:bg-slate-900 shadow-sm ${
                    featured ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-2.5 left-5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      Popular
                    </span>
                  )}
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                  <div className="mt-2 mb-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">${plan.priceUsd}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      /{plan.interval === 'month' ? 'mo' : 'forever'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 min-h-[40px]">{plan.tagline}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    {plan.limit === null ? 'Unlimited transcriptions' : `${plan.limit} transcriptions`}
                  </div>

                  <div className="mt-auto">
                    {isCurrent ? (
                      <div className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Current plan
                      </div>
                    ) : plan.id === 'FREE' || isDowngrade ? (
                      <button
                        onClick={manage}
                        disabled={!sub?.canManage || busyPlan === '__manage__'}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {sub?.canManage ? 'Switch in portal' : 'Included'}
                      </button>
                    ) : (
                      <button
                        onClick={() => upgrade(plan.id)}
                        disabled={!plan.purchasable || busyPlan === plan.id}
                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {busyPlan === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            {currentPlan === 'FREE' ? <Sparkles className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                            {currentPlan === 'FREE' ? 'Upgrade' : 'Switch'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
