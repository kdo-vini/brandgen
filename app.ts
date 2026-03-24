import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

import { createScrapeRoutes } from "./routes/scrapeRoutes.js";
import { createGenerateRoute } from "./routes/generateRoute.js";
import { createImageRoute } from "./routes/imageRoute.js";
import { createStripeRoutes } from "./routes/stripeRoutes.js";

// ─── Singletons ───────────────────────────────────────────────────────────────

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
  : null;

// ─── Express app ─────────────────────────────────────────────────────────────

const app = express();
app.use(cors());

// Stripe webhook MUST be registered before express.json() (needs raw body)
app.use(createStripeRoutes(stripe, supabaseAdmin));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(createScrapeRoutes());
app.use(createGenerateRoute(supabaseAdmin));
app.use(createImageRoute(supabaseAdmin));

export { app };
