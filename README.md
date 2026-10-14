# YourThumb — OFFGRID Public Source Repository

YourThumb is an AI-assisted YouTube thumbnail production studio. This repository preserves the real Next.js/React/TypeScript frontend and original directory layout while redacting proprietary server-side implementations.

**Live product:** https://yourthumb.tech/

## What this repository contains

- The actual homepage, dashboard, sign-in UI, thumbnail intake workflow, and reusable components from the project.
- The three public workflow interfaces: Copycat, Frame-Based, and Asset-Based.
- The generation-credit and INR/USD top-up interfaces.
- The review checkpoint, result display, and Canva connection UI.
- Original route paths and import locations, with fixed-path API proxy wrappers where production implementations have been redacted.

## What is intentionally redacted

Files marked `TRADE_SECRET` have been intentionally stubbed. This includes the proprietary ideation system prompt, concept-generation and rendering instructions, render-worker orchestration, private payment fulfillment and webhook implementation, admin credit/referral logic, production SQL schema, scheduled-job implementation, audit bundles, and internal deployment runbooks. Those implementations remain on the private hosted backend. Do not deploy the placeholder Supabase function or use `supabase/schema.sql` to initialize a database.

This repository is a sanitized public source package, not a copy of the private production backend. The UI is real; the redacted worker and strategy modules are not functional locally.

## How the live connection works

The `app/api/**/route.ts` files forward requests to the official hosted backend through `lib/backend/live-proxy.ts`. The proxy has a fixed route path for every endpoint and only permits HTTPS hosts under `yourthumb.tech`. It forwards the session cookie and selected request headers to the hosted endpoint; it does not contain prompts, API provider keys, or private generation logic. Scheduled-job and webhook routes are deliberately disabled in this public package.

**Important security note:** only run this code on a machine or deployment you trust. When you sign in through a locally running clone, the proxy forwards your session cookie to `https://yourthumb.tech` so the existing backend can authenticate you. Do not use a third-party-hosted fork with your account. Never add payment/provider credentials or a Supabase service-role key to a public repository.

Some flows are origin-bound. Canva OAuth is intentionally sent to the official host so that OAuth state cookies and callbacks stay on the correct domain. Payment approval/capture callbacks are also configured for the production domain, so a checkout started from localhost may not complete unless the browser is authenticated on the official host. For a complete payment or Canva demo, use https://yourthumb.tech directly.

## Local setup

Requirements: Node.js 20 or newer and npm.

```bash
cp .env.example .env.local
# Edit .env.local with the public Supabase URL and anon key for the same project used by YourThumb.
npm install
npm run dev
```

Open <http://localhost:3000>. The Supabase project must allow `http://localhost:3000/auth/callback` in its authentication redirect URLs, and Google OAuth must be configured for that same project. Public Supabase URL/anon-key values are not provider secrets, but must be configured correctly.

To lint and build:

```bash
npm run lint
npm run build
```

A successful build verifies the frontend bundle only. It does not restore the redacted AI engine, worker, schema, payment fulfillment, or affiliate logic.

## Demo behavior and limitations

- The UI submits generation, render, credit, Canva, and reference-related API calls to the hosted backend using the currently authenticated session. Backend access depends on your account, available credits, Supabase redirect configuration, and hosted-service availability.
- Payment/Canva flows may leave the local origin and return to the official hosted site.
- Affiliate/payout actions and private scheduled/webhook routes are intentionally unavailable in this public source package.
- This repository does not include a production database schema or a runnable rendering worker.

## Tech stack

Next.js, React, TypeScript, Supabase, OpenAI-backed generation via the hosted service, Upstash QStash/GitHub Actions in the private production architecture, Razorpay, PayPal, and Canva integration. Provider credentials and backend implementation are not included.

## Source and intellectual property

Do not add proprietary prompt files, private audit dumps, production database schemas, credentials, user data, or worker implementation to this repository. A filename or comment reading `TRADE_SECRET` is a reminder; the protection comes from the sensitive implementation being absent.
