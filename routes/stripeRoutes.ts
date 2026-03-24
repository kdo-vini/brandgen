import express from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export function createStripeRoutes(
  stripe: Stripe | null,
  supabaseAdmin: SupabaseClient | null,
) {
  const router = express.Router();

  // Webhook needs raw body — registered before express.json()
  router.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const sig = req.headers["stripe-signature"] as string;
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err: any) {
        console.error("[Stripe webhook] signature error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (!supabaseAdmin) {
        return res.status(500).json({ error: "DB not configured" });
      }

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.user_id;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          if (userId && subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const periodEnd = sub.items.data[0]?.current_period_end;
            await supabaseAdmin.from("subscriptions").upsert(
              {
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                plan: "pro",
                status: sub.status,
                current_period_end: periodEnd
                  ? new Date(periodEnd * 1000).toISOString()
                  : null,
                cancel_at_period_end: sub.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
          }
        }

        if (event.type === "customer.subscription.updated") {
          const sub = event.data.object as Stripe.Subscription;
          const userId = sub.metadata?.user_id;
          if (userId) {
            const periodEnd = sub.items.data[0]?.current_period_end;
            await supabaseAdmin
              .from("subscriptions")
              .update({
                status: sub.status,
                plan:
                  sub.status === "active" || sub.status === "trialing"
                    ? "pro"
                    : "free",
                current_period_end: periodEnd
                  ? new Date(periodEnd * 1000).toISOString()
                  : null,
                cancel_at_period_end: sub.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", sub.id);
          }
        }

        if (event.type === "customer.subscription.deleted") {
          const sub = event.data.object as Stripe.Subscription;
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "canceled",
              plan: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", sub.id);
        }

        if (event.type === "invoice.payment_failed") {
          const invoice = event.data.object as Stripe.Invoice;
          const subId = (
            invoice.parent?.subscription_details?.subscription ?? null
          ) as string | null;
          if (subId) {
            await supabaseAdmin
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", subId);
          }
        }
      } catch (err) {
        console.error("[Stripe webhook] handler error:", err);
      }

      res.json({ received: true });
    },
  );

  router.post("/api/stripe/checkout", async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

    const { userId, userEmail } = req.body as {
      userId: string;
      userEmail: string;
    };
    if (!userId || !userEmail) {
      return res.status(400).json({ error: "userId and userEmail required" });
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      return res
        .status(500)
        .json({ error: "STRIPE_PRO_PRICE_ID not configured" });
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";

    try {
      let customerId: string | undefined;
      if (supabaseAdmin) {
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("stripe_customer_id")
          .eq("user_id", userId)
          .maybeSingle();
        customerId = sub?.stripe_customer_id ?? undefined;
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        customer_email: customerId ? undefined : userEmail,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { user_id: userId },
        subscription_data: { metadata: { user_id: userId } },
        success_url: `${appUrl}/?checkout=success`,
        cancel_url: `${appUrl}/?checkout=cancel`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Stripe checkout] error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/api/stripe/portal", async (req, res) => {
    if (!stripe)
      return res.status(500).json({ error: "Stripe not configured" });

    const { userId } = req.body as { userId: string };
    if (!userId) return res.status(400).json({ error: "userId required" });

    if (!supabaseAdmin)
      return res.status(500).json({ error: "DB not configured" });

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return res.status(404).json({ error: "No Stripe customer found" });
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: appUrl,
      });
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Stripe portal] error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
