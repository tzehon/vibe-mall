# Vibe Mall Implementation Plan

## Product Goal

Build **Vibe Mall**, a polished minimal end-to-end hackathon demo for an OpenAI customer that runs a major eCommerce platform.

Vibe Mall lets a logged-in shopper type a vibe, retrieves matching products from MongoDB Atlas Vector Search using Atlas Automated Embedding with `voyage-4`, calls the Codex SDK server-side to generate a themed storefront, renders the generated HTML in a sandboxed iframe, and lets the user publish a shareable Mall URL.

## Current Status

- Milestones 1 through 8 are complete.
- Next step: record the 5-minute demo using `docs/video-script.md` and `docs/demo-checklist.md`.
- The app root is `/Users/tth/projects/vibe-mall`; do not create a nested project directory.
- The app uses Next.js App Router, TypeScript, MongoDB Node driver, simple credentials auth, Vitest, and Playwright.
- Codex generation, draft iframe preview, publishing, public share URLs, demo-polish UI, hardening tests, browser smoke tests, and final demo communication docs are implemented.

## Core Requirements

- Login and authorization are required.
- MongoDB Atlas persistence is required.
- Product semantic search must use MongoDB Atlas Vector Search with Automated Embedding.
- The Atlas vector index must use `autoEmbed` with `voyage-4`.
- Application code must send query text to Atlas and must not generate product embeddings.
- The running app must call Codex programmatically server-side through the Codex SDK.
- Codex credentials and MongoDB access must stay server-side.
- Generated storefront HTML must be treated as untrusted and rendered only through a sandboxed iframe.
- Seed data must use data-URI SVG product images.
- Published storefronts must have public share URLs, while private drafts remain owner-only.
- Meaningful tests must cover auth, authorization, generation, persistence visibility, iframe sandboxing, and Atlas query shape.

## Stack And Boundaries

- Framework: Next.js App Router.
- Language: TypeScript.
- Runtime: Node.js on the server for generation and database work.
- Database: MongoDB Atlas via the MongoDB Node driver.
- Search: MongoDB Atlas Vector Search with Automated Embedding.
- Embedding model: Atlas `autoEmbed` with `voyage-4`.
- Auth: simple credentials login with secure password hashing and signed HTTP-only cookies.
- Codex integration: `@openai/codex-sdk`, isolated behind the server-side generation wrapper.
- Testing: Vitest for unit and route tests; Playwright for browser smoke tests.
- Styling: global CSS with reusable components and compact demo visuals.

## Key Files

- App pages: `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/create/page.tsx`, `src/app/mall/page.tsx`, `src/app/storefronts/[id]/page.tsx`.
- API routes: `src/app/api/auth/*`, `src/app/api/generate/route.ts`, `src/app/api/storefronts/[id]/publish/route.ts`.
- Embed route: `src/app/storefronts/[id]/embed/route.ts`.
- UI components: `src/components/CreateStorefrontClient.tsx`, `src/components/StorefrontPreview.tsx`, `src/components/PublishStorefrontPanel.tsx`, `src/components/SiteHeader.tsx`.
- Core libraries: `src/lib/auth.ts`, `src/lib/session.ts`, `src/lib/productSearch.ts`, `src/lib/storefronts.ts`, `src/lib/htmlSafety.ts`, `src/lib/codex/generateStorefrontHtml.ts`, `src/lib/codex/prompt.ts`.
- Seed and Atlas scripts: `src/scripts/seed.ts`, `src/scripts/create-atlas-vector-index.ts`, `src/scripts/teardown.ts`.
- Docs: `README.md`, `docs/atlas-auto-embedding.md`, `docs/video-script.md`, `docs/demo-checklist.md`.
- E2E: `e2e/vibe-mall.spec.ts`.

## Data Model

### `users`

```ts
{
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
}
```

Indexes: unique `email`.

### `products`

```ts
{
  _id: ObjectId;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  palette: string[];
  imageDataUri: string;
  tags: string[];
  searchText: string;
  active: boolean;
}
```

Indexes:

- Unique `sku`.
- Atlas Vector Search index over `searchText` using Automated Embedding with `autoEmbed` and `voyage-4`.

Important constraint: do not store application-generated embeddings, call embedding APIs, or pass `queryVector` from application code.

### `storefronts`

```ts
{
  _id: ObjectId;
  ownerId: ObjectId;
  vibe: string;
  title: string;
  slug: string;
  productIds: ObjectId[];
  productsSnapshot: ProductSnapshot[];
  generatedHtml: string;
  codexThreadId?: string;
  status: "draft" | "published";
}
```

Indexes:

- `{ ownerId: 1, createdAt: -1 }`.
- Unique sparse `slug`.
- `{ status: 1, publishedAt: -1 }`.

## Environment Variables

```bash
MONGODB_URI=
MONGODB_DB=
AUTH_SECRET=
OPENAI_API_KEY=
CODEX_DEMO_MODE=false
CODEX_MODEL=
CODEX_REASONING_EFFORT=none
NEXT_PUBLIC_APP_URL=http://localhost:3000
ATLAS_PROJECT_ID=
ATLAS_CLUSTER_NAME=
ATLAS_SEARCH_INDEX_NAME=products_voyage4_autoembed
```

## Routes

- `/` - polished demo home page with product concept, proof points, and AI Assembly Line.
- `/login` - credentials login with demo merchant account buttons.
- `/create` - protected vibe composer that retrieves products, streams Codex generation updates, previews the sandboxed draft, and publishes.
- `/mall` - public gallery of published storefronts plus signed-in user shelves.
- `/storefronts/[id]` - public published storefront page or owner-only draft details page.
- `/storefronts/[id]/embed` - authorized `text/html` response containing generated HTML for iframe rendering.

## API Routes

- `POST /api/auth/login` - verifies credentials and creates a session cookie.
- `POST /api/auth/logout` - clears the session.
- `GET /api/auth/me` - returns the current authenticated user.
- `POST /api/generate` - requires auth, searches products, calls Codex or demo generation, validates HTML, saves a draft, and streams progress/code events.
- `POST /api/storefronts/[id]/publish` - requires owner auth, publishes a draft, and returns public and embed URLs.

## Milestones

- [x] 1. Scaffold app and core layout.
- [x] 2. MongoDB persistence, product seed data, and Atlas auto-embedding setup.
- [x] 3. Login and authorization.
- [x] 4. Codex SDK generation route.
- [x] 5. Sandboxed rendering, publishing, and share URLs.
- [x] 6. Demo polish and technical explainer UI.
- [x] 7. Meaningful tests and hardening.

## Completed Implementation Notes

- The app uses the current folder as the root and keeps all generated code in the existing Next.js project.
- Product seed data contains 420 deterministic products with data-URI SVG artwork and sample-vibe-aligned search text.
- `npm run seed` seeds MongoDB data and invokes the shared Atlas Vector Search index helper.
- The Atlas search helper uses `$vectorSearch` with text query input, score projection, active filtering, normalized results, and no `queryVector`.
- A clearly labeled fallback path exists for `CODEX_DEMO_MODE=true` so local tests and emergency demos do not call live Codex.
- Credentials auth uses PBKDF2 password verification and signed HTTP-only session cookies.
- Two seeded merchant accounts are visible on the login page for ownership demos.
- `POST /api/generate` requires auth, searches products, calls the server-side Codex wrapper, validates HTML, persists a draft storefront, and returns sandboxed preview metadata.
- Codex output validation rejects scripts, frames, forms, event handlers, JavaScript URLs, external network references, markdown-only output, and missing selected products/prices.
- The embed route serves generated `text/html` only for public published storefronts or owner-visible drafts.
- Embed responses use strict CSP, `no-store` for drafts, and public cache headers for published storefronts.
- Storefront previews use an iframe with a restrictive `sandbox` attribute and no same-origin privilege.
- Publishing preserves the stable slug and returns both public detail and direct embed URLs.
- The create page streams server-side search, Codex, validation, save, and generated code events over SSE.
- The home, create, mall, and storefront detail pages have been polished for a short recorded demo.
- Playwright covers unauthenticated `/create` redirects and a seeded demo login/generate/sandbox/publish/public-share flow when env is available.

## Commands

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Seed demo data and ensure the Atlas Search index:

```bash
npm run seed
```

Create or update only the Atlas Search index:

```bash
npm run atlas:index
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Demo URL:

```text
http://localhost:3000
```

## Test Plan

- Unit test session creation, session lookup, cookie tampering, and auth guards.
- Unit test unauthenticated and unauthorized API requests.
- Unit test owner-only storefront access and public/private visibility rules.
- Unit test Codex generation route with Codex mocked or demo mode enabled.
- Unit test product search query construction to prove the app uses Atlas text auto-embedding instead of app-generated vectors.
- Unit test seed data for category coverage, SVG data URIs, rich search text, deterministic output, and sample-vibe alignment.
- Unit test HTML safety and sandbox/CSP boundaries.
- Source-boundary tests ensure the Codex SDK import stays server-side, client components do not read secrets, React does not use `dangerouslySetInnerHTML`, and iframe sandbox attributes remain restrictive.
- Playwright smoke tests cover login, generation, sandboxed iframe preview, publish, and anonymous public share viewing.

## Latest Validation Summary

- `npm test`: passed with 14 test files and 58 tests.
- `npm run lint`: passed.
- `npm run build`: passed with Next.js production compile and 10 static pages generated.
- Previous `npm run typecheck`: passed.
- `npm run test:e2e`: passed with 2 Playwright tests after local server/browser setup.
- `npm run seed`: passed against Atlas after the latest product artwork updates; the Atlas Vector Search index was queryable.
- Read-only Atlas spot check confirmed noun-specific SVG artwork for a representative product.

## Decision Log

- Use the current folder as the app root.
- Use Next.js App Router, TypeScript, MongoDB Node driver, and simple credentials auth.
- Require Atlas Vector Search Automated Embedding with `autoEmbed` and `voyage-4`.
- Keep semantic search text-based with `$vectorSearch.query.text`; never use `queryVector`.
- Keep MongoDB and Codex access server-side only.
- Use `@openai/codex-sdk` instead of the Codex CLI or Codex MCP.
- Keep the real Codex SDK import inside the server-side generation function and behind the non-demo path.
- Run Codex generation in the Node.js runtime with read-only sandboxing, disabled web search, a minimal child-process environment, and no approval prompts.
- Preserve `CODEX_DEMO_MODE=true` for deterministic tests and emergency demos.
- Validate generated HTML before persistence and reject unsafe output instead of relying on broad sanitization.
- Reject external CSS asset URLs in generated HTML and serve embeds with `img-src data:` so storefronts stay self-contained.
- Save generated storefronts as drafts immediately after generation.
- Serve generated HTML through the embed route with restrictive CSP and render it with `sandbox=""`.
- Use stable slugs for public share URLs and preserve the slug during publishing.
- Return `no-store` for draft embeds and public cache headers for published embeds.
- Use data-URI SVG product images for reliable demos.
- Keep teardown guarded by `--confirm reset-vibe-mall` and scoped to known app collections plus the search index.
- Keep suggested sample vibe chips and seed data coupled through tests.
- Keep multiple seeded merchant accounts visible on the login page for ownership demos.
- Run Playwright against a controlled local Next dev server on `localhost:3100` with `CODEX_DEMO_MODE=true`.