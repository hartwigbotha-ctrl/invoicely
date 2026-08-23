# Nimblo

A simple invoicing web app for small businesses and contractors — create clients, send
professional PDF invoices, track paid/overdue status, and set up recurring
invoices that generate (and email) themselves automatically. Built as an
alternative to spreadsheets and to apps like Invoice2Go, tailored so it can
be run and owned by a single business/dev team.

Each business that signs up gets its own isolated account (multi-tenant):
its own clients, invoices, invoice numbering sequence, and settings.

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions)
- **Drizzle ORM** + **better-sqlite3** — file-based SQL database, zero
  external services required to run. (Swappable to Postgres — see below.)
- **NextAuth v5** (Credentials provider, JWT sessions) for email/password auth
- **@react-pdf/renderer** for generating branded invoice PDFs
- **nodemailer** for emailing invoices (falls back to console logging if no
  SMTP is configured, so you can develop without a mail server)
- **Tailwind CSS v4** for styling

## Getting started

```bash
npm install
cp .env.example .env.local
# edit .env.local — at minimum, set AUTH_SECRET (see below)

npm run db:push     # creates data/app.db and applies the schema
npm run db:seed     # seeds the 3 default subscription plans

npm run dev
```

Generate a secret for `AUTH_SECRET`:

```bash
npx auth secret
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Open http://localhost:3000, click **Start your free trial**, and create your
first business account.

## Sending real emails

By default (no `SMTP_HOST` set), invoice emails are **not actually sent** —
they're logged to the console so you can develop without a mail server.
To send real emails, fill in the SMTP settings in `.env.local`:

```
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Nimblo <no-reply@yourdomain.com>"
```

Any standard SMTP provider works (SendGrid, Mailgun, Resend's SMTP endpoint,
your own mailbox, etc).

## Recurring invoices — how auto-generation works

Recurring schedules (`/recurring`) store a frequency (weekly / monthly /
quarterly / annually), a set of line items, and a `nextRunDate`. There are
three ways a schedule actually gets triggered:

1. **Manually** — click "Run now" on the Recurring page.
2. **Self-hosted daily cron (in-process)** — set `RECURRING_CRON_ENABLED=true`
   in your environment. The app will start an in-process daily job (06:00
   server time) using `node-cron`. Good for a VPS/single-server deployment
   where the Node process stays running.
3. **Serverless / external scheduler** — hit `GET /api/cron/recurring` from
   an external scheduler (e.g. a Vercel Cron Job, a system crontab, GitHub
   Actions on a schedule, etc). Set `CRON_SECRET` and send
   `Authorization: Bearer <CRON_SECRET>` so only your scheduler can trigger it.
   Example Vercel `vercel.json`:

   ```json
   {
     "crons": [{ "path": "/api/cron/recurring", "schedule": "0 6 * * *" }]
   }
   ```

You can also run it directly from the command line (useful for a plain
system crontab entry):

```bash
npm run recurring:run
```

If a schedule was dormant for a while (e.g. the server was down), the next
trigger will catch it up, generating one invoice per missed period.

## Database

Defaults to a local SQLite file at `data/app.db` — no external database
needed to get running. This is a good fit for a single-server / VPS
deployment for one business's internal use.

If you outgrow SQLite (multiple app servers, need managed backups, etc.),
swap `src/db/index.ts` and `drizzle.config.ts` from the `better-sqlite3`
driver to a Postgres driver (e.g. `drizzle-orm/node-postgres` or
`drizzle-orm/neon-http`) — the schema in `src/db/schema.ts` uses
`sqlite-core` table builders, so you'd port it to `pg-core` equivalents
(the shapes map over almost 1:1). This is a deliberate scope cut to keep
the app deployable without provisioning a database server first.

## Monetizing this as a monthly SaaS product

The data model already has `plans` and `subscriptions` tables (see
`src/db/schema.ts`) with 3 seeded plans (Starter/free trial, Pro, Business).
Every new signup is automatically enrolled in a 14-day trial. **Payment
collection itself is not wired up yet** — that's the one deliberately
deferred piece, since it depends on which processor you want (PayFast is
the natural choice for South African billing in ZAR; Stripe if you want
international cards). To finish this:

1. Pick a processor and add its SDK.
2. On successful checkout/webhook, update the business's `subscriptions`
   row (`status`, `provider`, `providerCustomerId`, `providerSubscriptionId`,
   `currentPeriodEnd`).
3. Add a check (e.g. in `requireBusiness()` in `src/lib/session.ts`) that
   blocks invoice creation once a trial/subscription has lapsed.

## Project structure

```
src/
  db/                  Drizzle schema + client
  lib/
    actions/           Server Actions (create/update/delete for each resource)
    auth.ts            NextAuth config (Credentials provider, JWT sessions)
    session.ts          requireSession() / requireBusiness() helpers
    invoice-utils.ts    Totals math, invoice numbering, overdue sweep
    invoice-pdf.tsx     PDF document definition (@react-pdf/renderer)
    mailer.ts           Email sending (SMTP or console fallback)
    recurring.ts         Date math for recurring schedules
    recurring-engine.ts  Core "generate an invoice from a schedule" logic
  app/
    (auth)/login, (auth)/register   Public auth pages
    (app)/...                        Authenticated app (dashboard, clients,
                                      invoices, recurring, settings) —
                                      protected by src/proxy.ts
    api/cron/recurring/route.ts      Serverless-friendly cron trigger
scripts/
  seed.ts               Seeds the 3 subscription plans
  run-recurring.ts       CLI entry point for generating due recurring invoices
```

## Deploying

Works on any Node.js host (a VPS, Railway, Render, Fly.io, etc.) since it
uses a local SQLite file — just make sure the `data/` directory is on
persistent storage, not ephemeral disk. On Vercel or another serverless
host, switch to a hosted Postgres (see "Database" above), since serverless
functions don't have a persistent local filesystem, and use the
`/api/cron/recurring` route instead of `RECURRING_CRON_ENABLED`.

```bash
npm run build
npm run start
```

Set the same environment variables from `.env.example` in your host's
environment settings, plus `AUTH_TRUST_HOST=true` if you're behind a proxy
or a domain that doesn't exactly match what NextAuth expects.
