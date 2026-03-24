/**
 * Vercel serverless entry point.
 * Exports the Express app from server.ts for Vercel to handle as a serverless function.
 *
 * NOTE: Vercel Hobby plan has a 10s function timeout.
 * The /api/generate route (4-step AI chain) may exceed this on complex requests.
 * Consider upgrading to Vercel Pro (60s timeout) for production use.
 */
import { app } from '../server';

export default app;
