import type { SupabaseClient } from "@supabase/supabase-js";

export async function getServerUserPlan(
  supabaseAdmin: SupabaseClient | null,
  userId: string,
): Promise<"free" | "pro"> {
  if (!supabaseAdmin) return "free";
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return "free";
  const active = data.status === "active" || data.status === "trialing";
  return active && data.plan === "pro" ? "pro" : "free";
}

export async function getServerUsage(
  supabaseAdmin: SupabaseClient | null,
  userId: string,
  month: string,
) {
  if (!supabaseAdmin) return { text_generations: 0, image_generations: 0 };
  const { data } = await supabaseAdmin
    .from("usage_tracking")
    .select("text_generations, image_generations")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();
  return data ?? { text_generations: 0, image_generations: 0 };
}

export async function incrementUsage(
  supabaseAdmin: SupabaseClient | null,
  userId: string,
  month: string,
  field: "text" | "image",
) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.rpc("increment_usage", {
    p_user_id: userId,
    p_month: month,
    p_text_generations: field === "text" ? 1 : 0,
    p_image_generations: field === "image" ? 1 : 0,
  });
}
