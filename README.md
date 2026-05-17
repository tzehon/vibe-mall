# Vibe Mall

Vibe Mall is a hackathon demo for an eCommerce storefront that codes itself.

A merchant types a vibe, the database finds matching products, Codex writes a themed storefront server-side, the app validates the generated HTML, and the merchant publishes a shareable Mall URL.

## Why It Matters

Major eCommerce platforms need fast, memorable merchandising surfaces without waiting on a full creative and engineering cycle. Vibe Mall shows how a platform could turn customer intent, seasonal moments, social trends, or merchant prompts into safe, shoppable campaign pages backed by real catalog data.

## Architecture

- Next.js App Router and TypeScript.
- Credentials login with signed HTTP-only session cookies.
- MongoDB persistence for `users`, `products`, and `storefronts`.
- MongoDB Vector Search over `products.searchText`.
- Automated Embedding with `autoEmbed` and `voyage-4`.
- Server-side `@openai/codex-sdk` generation in `POST /api/generate`, with no direct app invocation of the Codex CLI package.
- Generated HTML validation before persistence.
- Generated HTML rendered only through `/storefronts/[id]/embed` in a strict sandboxed iframe.
- Published storefronts have stable public URLs under `/storefronts/[slug]`.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example`:

```bash
MONGODB_URI=
MONGODB_DB=
AUTH_SECRET=
OPENAI_API_KEY=
CODEX_DEMO_MODE=false
CODEX_MODEL=
CODEX_REASONING_EFFORT=none
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate `AUTH_SECRET` with a cryptographically secure 32-byte random value:

```bash
openssl rand -base64 32
```

Use a different `AUTH_SECRET` per environment, never commit it, and avoid rotating it casually because existing signed auth sessions may become invalid.

## Seed Data

Seed the demo merchant, product catalog, and Vector Search index:

```bash
npm run seed
```

Demo merchants:

```text
Primary merchant
Email: demo@vibemall.local
Password: vibe-mall-demo

Second merchant
Email: second@vibemall.local
Password: vibe-mall-second
```

The seed is idempotent and creates visually reliable products with item-style
inline SVG data-URI images. After writing products, it creates or verifies the
`product_vibe_autoembed` Vector Search index and waits until it is queryable.

## Auto-Embedding Index

`npm run seed` creates or verifies the Vector Search index automatically.
It uses the MongoDB Node driver `createSearchIndex()` helper, then polls
`listSearchIndexes()` until the index is queryable.

The app sends text queries to MongoDB with `$vectorSearch`. It does not generate embeddings and does not call Voyage directly.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

Recommended demo path:

1. Log in as the demo merchant.
2. Open `/create`.
3. Use `Pokemon style cute birthday`.
4. Generate the storefront and watch the Codex source stream.
5. Review retrieved products and the sandboxed generated storefront preview.
6. Publish to the Mall; the sandboxed embed opens in a new tab.
7. Return to the details page to copy or reopen the published storefront link.

## Tests

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

The Vitest unit suite focuses on the app's required safety and
ownership boundaries:

- Authentication primitives: password verification, signed session
  tokens, tamper rejection, and session expiry.
- Authorization rules: drafts are owner-only, published storefronts are public,
  unauthenticated generation is rejected, and publishing requires ownership.
- Generation route behavior: product search, Codex generation, MongoDB writes,
  generated HTML validation before persistence, and streaming progress events,
  with Codex and MongoDB mocked for deterministic tests.
- MongoDB Vector Search request shape: product search sends a text query for MongoDB
  Automated Embedding, uses the `product_vibe_autoembed` index and `voyage-4`,
  projects `vectorSearchScore`, and never sends an application-generated
  `queryVector`.
- Generated HTML safety: validation accepts complete self-contained storefront
  HTML with inline CSS and data-URI product images, and rejects scripts, event
  handlers, forms, nested frames, JavaScript URLs, external styles/fonts,
  markdown-only output, and missing selected product names or prices.
- Rendering and server/client boundaries: generated HTML is never rendered with
  `dangerouslySetInnerHTML`, storefront previews use strict `<iframe
  sandbox="">` attributes, client components do not read server secrets, and the
  Codex SDK import is isolated to the server-side wrapper.
- Seed and demo metadata: seeded products are deterministic, have unique SKUs,
  include inline SVG data-URI images, cover the required categories, and expose
  rich `searchText` for semantic retrieval. The tests also assert that every
  suggested sample vibe chip has visibly related seeded product data.

Unit tests do not require live MongoDB or live Codex. Live-service validation is a manual demo check once environment variables and MongoDB indexes are configured.

Playwright E2E tests run against a local Next.js dev server on
`localhost:3100` by default:

- The always-on browser test opens `/create` as an unauthenticated visitor and
  verifies the app redirects to `/login?next=/create&message=auth_required`,
  shows recovery copy, and pre-fills the seeded demo email.
- The seeded demo smoke test logs in with the demo merchant, generates a
  storefront with `CODEX_DEMO_MODE=true`, verifies the preview iframe has a
  strict empty `sandbox` attribute, publishes the draft, clears cookies, opens
  the public URL, and verifies the public iframe is sandboxed too.

The seeded demo smoke test automatically skips unless `MONGODB_URI`,
`MONGODB_DB`, and `AUTH_SECRET` are available through the shell environment or
`.env.local`. Run `npm run seed` first so the demo user and products exist. The
test deletes the storefront it creates after the assertions finish.

If Playwright browsers have not been installed on the machine yet, run:

```bash
npx playwright install chromium
```

## Codex SDK Usage

`POST /api/generate` runs in the Node.js runtime. It requires auth, searches products, calls `@openai/codex-sdk` server-side, streams generated code chunks to the Create page, validates the returned HTML document, saves a draft storefront, and returns a preview URL. The app depends directly on the Codex SDK only; it does not call a Codex CLI binary or shell out from application code.

When `CODEX_DEMO_MODE=true`, the route uses deterministic local HTML generation for tests and emergency demos. When `CODEX_DEMO_MODE` is not `true`, `OPENAI_API_KEY` is required and the running app calls the real Codex SDK.

For recording-friendly live Codex runs, set `CODEX_REASONING_EFFORT=none`. If
the variable is omitted or invalid, the app falls back to `low`. The app sends a
compact product payload and limits the Codex input to four retrieved products.
Supported values for the current `gpt-5.5` configuration are `none`, `low`,
`medium`, `high`, and `xhigh`. You can optionally set `CODEX_MODEL` to override
the SDK default model.

## Generated HTML Security

Generated HTML is treated as untrusted.

- Validation rejects scripts, frames, forms, inline event handlers, JavaScript URLs, external network requests, and missing product names/prices.
- Storefront previews use `<iframe sandbox="">`.
- The iframe does not use `allow-same-origin`, `allow-forms`, or `allow-scripts`.
- Embed responses set a strict Content Security Policy including `default-src 'none'`, `script-src 'none'`, `connect-src 'none'`, `form-action 'none'`, and `frame-ancestors 'self'`.
- Draft embeds are owner-only and `no-store`; published embeds are public and cacheable.

## Demo Mode

For deterministic local demos without Codex:

```bash
CODEX_DEMO_MODE=true
```

This still uses MongoDB for users, products, and storefronts. Product search falls back to deterministic text/tag matching and the UI labels fallback mode clearly.

## Rubric Checklist

- Login and authorization.
- Data persistence.
- Product semantic search through Vector Search.
- Automated Embedding with `autoEmbed` and `voyage-4`.
- No app-generated embeddings.
- Server-side Codex SDK call inside the running app.
- Generated storefront HTML validation.
- Sandboxed iframe rendering only.
- Publish to public Mall URL.
- Meaningful tests.

## Teardown

Reset the demo database before starting from scratch:

```bash
npm run teardown -- --confirm reset-vibe-mall
```

This drops only the Vibe Mall app collections in `MONGODB_DB`: `storefronts`,
`products`, `users`, and `sessions`. It also drops the
`product_vibe_autoembed` Vector Search index when present.

To keep the Vector Search index and only clear the collections:

```bash
npm run teardown -- --confirm reset-vibe-mall --skip-search-index
```

Then reseed. The seed command will recreate or verify the index:

```bash
npm run seed
```
