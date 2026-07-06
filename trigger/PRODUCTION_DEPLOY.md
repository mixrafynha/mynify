# Trigger.dev production deploy

This trigger folder is production-ready for the current JSON-source-of-truth design pipeline.

## Tasks exported

`trigger/index.ts` exports:

- `generate-font-preview`
- `generate-template-preview`
- `generate-checkout-thumbnail`
- `generate-design-print-file`

The checkout thumbnail and print-file jobs are now included in the root Trigger entrypoint, so `npx trigger.dev deploy` can register them in production.

## Required production environment variables

Set these in the Trigger.dev dashboard/project environment:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_URL=
```

Supported fallbacks are also accepted by `trigger/shared/r2.ts`:

```env
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
R2_BUCKET_NAME=
```

## Required production dependencies

These must exist in the app's package.json dependencies/devDependencies:

```bash
npm install @trigger.dev/sdk @supabase/supabase-js @aws-sdk/client-s3 sharp playwright
npx playwright install chromium
```

If Trigger Cloud uses its own runtime image, make sure the deployed environment supports Playwright Chromium. The renderer dynamically imports Playwright at runtime to avoid Trigger bundling errors.

## Deploy commands

Local validation:

```bash
npx trigger.dev dev
```

Production deploy:

```bash
npx trigger.dev deploy
```

After deploy, test from the live site:

1. Save a design.
2. Open Trigger.dev Dashboard > Runs.
3. Confirm both runs appear:
   - `generate-checkout-thumbnail`
   - `generate-design-print-file`
4. Confirm Supabase updates:
   - `design_image_url`
   - `mockups.checkout_thumbnail_url`
   - `print_files.front` / `print_files.back`

## Production behavior

On success:

- Checkout thumbnail uploads WebP to R2.
- Print file uploads PNG to R2.
- Supabase is updated with ready status and URLs.

On failure:

- The job marks the relevant DB JSON status as `failed`.
- The error message is written into `design_data.production.jobs.*.error`, `print_files.error`, or `mockups.checkout_thumbnail_error`.
- The job still throws so Trigger.dev records a failed run and keeps retry behavior visible.
