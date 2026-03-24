import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { PLAN_LIMITS } from './planLimits';
export { PLAN_LIMITS };

// ─── Plan definitions ──────────────────────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';

export type PlanLimits = typeof PLAN_LIMITS[SubscriptionPlan];

export type SubscriptionInfo = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  isActive: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
};

export type UsageInfo = {
  month: string;
  textGenerations: number;
  imageGenerations: number;
};

const DEFAULT_SUBSCRIPTION: SubscriptionInfo = {
  plan: 'free',
  status: 'active',
  isActive: true,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
};

const DEFAULT_USAGE: UsageInfo = {
  month: currentMonth(),
  textGenerations: 0,
  imageGenerations: 0,
};

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubscription(user: User | null) {
  const [subscription, setSubscription] = useState<SubscriptionInfo>(DEFAULT_SUBSCRIPTION);
  const [usage, setUsage] = useState<UsageInfo>(DEFAULT_USAGE);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setSubscription(DEFAULT_SUBSCRIPTION);
      setUsage(DEFAULT_USAGE);
      setLoading(false);
      return;
    }

    setLoading(true);
    const month = currentMonth();

    const [subResult, usageResult] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('usage_tracking').select('*').eq('user_id', user.id).eq('month', month).maybeSingle(),
    ]);

    const sub = subResult.data;
    setSubscription(
      sub
        ? {
            plan: (sub.plan as SubscriptionPlan) ?? 'free',
            status: (sub.status as SubscriptionStatus) ?? 'active',
            isActive: sub.status === 'active' || sub.status === 'trialing',
            currentPeriodEnd: sub.current_period_end ?? null,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            stripeCustomerId: sub.stripe_customer_id ?? null,
          }
        : DEFAULT_SUBSCRIPTION,
    );

    const u = usageResult.data;
    setUsage({
      month,
      textGenerations: u?.text_generations ?? 0,
      imageGenerations: u?.image_generations ?? 0,
    });

    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return { subscription, usage, loading, reload: load };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canAddBrand(plan: SubscriptionPlan, currentBrandCount: number): boolean {
  return currentBrandCount < PLAN_LIMITS[plan].brands;
}

export function canGenerateImage(plan: SubscriptionPlan, imageGenerationsThisMonth: number): boolean {
  return imageGenerationsThisMonth < PLAN_LIMITS[plan].imageGenerationsPerMonth;
}

export function canGenerateText(plan: SubscriptionPlan, textGenerationsThisMonth: number): boolean {
  return textGenerationsThisMonth < PLAN_LIMITS[plan].textGenerationsPerMonth;
}

export function planLabel(plan: SubscriptionPlan): string {
  return plan === 'pro' ? 'Social Media Pro' : 'Grátis';
}
