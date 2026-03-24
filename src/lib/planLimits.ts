// Shared plan limits — safe to import on both server and client.
// No browser deps (no supabase client, no Vite env vars).

export const PLAN_LIMITS = {
  free: {
    brands: 1,
    textGenerationsPerMonth: 15,
    imageGenerationsPerMonth: 3,
  },
  pro: {
    brands: 3,
    textGenerationsPerMonth: 150,
    imageGenerationsPerMonth: 40,
  },
} as const;

export type SubscriptionPlanKey = 'free' | 'pro';
export type PlanLimits = typeof PLAN_LIMITS[SubscriptionPlanKey];
