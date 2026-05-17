# Vibe Mall Demo Checklist

Use this checklist before recording the 5-minute hackathon video.

## 1. Pre-Demo Environment Checklist

- [ ] `.env.local` exists and is not shown on screen.
- [ ] `MONGODB_URI` is set.
- [ ] `MONGODB_DB` is set.
- [ ] `AUTH_SECRET` is set to a strong random value.
- [ ] `OPENAI_API_KEY` is set when recording live Codex generation.
- [ ] `NEXT_PUBLIC_APP_URL` is set to the recording URL, usually `http://localhost:3000`.
- [ ] `CODEX_DEMO_MODE` is set intentionally:
  - `false` for the real Codex SDK path.
  - `true` for deterministic backup demos and tests.
- [ ] Optional `CODEX_MODEL` is set only if overriding the SDK default.
- [ ] Optional `CODEX_REASONING_EFFORT` is set intentionally, for example `none` for recording-friendly live runs.

## 2. MongoDB Checklist

- [ ] Atlas cluster is reachable from the recording machine.
- [ ] Products are seeded.
- [ ] Demo users are seeded.
- [ ] `product_vibe_autoembed` index exists on the products collection.
- [ ] Atlas Automated Embedding is configured with `voyage-4`.
- [ ] The app sends text queries to Atlas and does not use app-generated embeddings.
- [ ] Manual index instructions are available at [docs/atlas-auto-embedding.md](./atlas-auto-embedding.md).

## 3. Commands

Install dependencies:

```bash
npm install
```

Seed demo data and create or verify the Atlas Vector Search index:

```bash
npm run seed
```

Optional index-only repair command, used when you need to recreate or verify the search index without reseeding products and users:

```bash
npm run atlas:index
```

Start the local app:

```bash
npm run dev
```

Run validation:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Run browser smoke tests when the local environment is seeded:

```bash
npm run test:e2e
```

Optional cleanup before reseeding:

```bash
npm run teardown -- --confirm reset-vibe-mall
```

Cleanup alias:

```bash
npm run cleanup -- --confirm reset-vibe-mall
```

## 4. Demo Flow Checklist

- [ ] Start the dev server with `npm run dev`.
- [ ] Open `http://localhost:3000`.
- [ ] Show the landing page and AI Assembly Line.
- [ ] Log in as the primary demo merchant:

```text
Email: demo@vibemall.local
Password: vibe-mall-demo
```

- [ ] Go to `/create`.
- [ ] Use the primary vibe:

```text
Pokemon style cute birthday
```

- [ ] Click **Generate with Codex**.
- [ ] Confirm the generation timeline appears.
- [ ] Confirm retrieved product cards appear.
- [ ] Confirm the UI labels product matching as database semantic search.
- [ ] Confirm the technical panel shows database retrieval, semantic search, Codex SDK, code validation, iframe sandbox, and database persistence.
- [ ] Confirm the generated storefront iframe appears.
- [ ] Click **Publish to the Mall**.
- [ ] Confirm the sandboxed embed opens in a new tab and the details page shows the published state.
- [ ] Open or copy the public share URL.
- [ ] Show `/mall` with the published storefront card.
- [ ] Show or run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

## 5. Backup Demo Plan

- [ ] Set `CODEX_DEMO_MODE=true` if live Codex generation is slow or unavailable.
- [ ] Rerun `npm run dev` after changing environment variables.
- [ ] Use a seeded vibe with strong catalog coverage:
  - `Pokemon style cute birthday`
  - `No wires clean desk refresh`
  - `Quiet luxury winterwear`
  - `neon rainy-night gamer dorm`
- [ ] Keep one pre-published storefront ready in the Mall.
- [ ] Explain fallback mode honestly: retrieval and generation are deterministic for demo reliability, and the UI labels fallback mode clearly.
- [ ] If Atlas is unavailable, show the docs and tests proving the required `$vectorSearch` pipeline shape, then use the fallback path for the video flow.

## 6. Screen Recording Checklist

- [ ] Browser zoom is set to a readable level, usually 100% or 110%.
- [ ] Bookmark bar and personal browser extensions are hidden if distracting.
- [ ] Secrets are hidden.
- [ ] Do not show API keys.
- [ ] Do not show full MongoDB connection strings.
- [ ] Clear old drafts if needed with teardown and reseed.
- [ ] Keep a terminal tab ready for validation commands.
- [ ] Keep Atlas open only if showing the `product_vibe_autoembed` index, not credentials.
- [ ] Use a clean browser profile or incognito window where appropriate.
- [ ] Disable noisy notifications.
- [ ] Make the app window wide enough to show the technical panel and iframe clearly.

## 7. Talking Points For The Rubric

- [ ] Working app: login, create, preview, publish, share, Mall gallery.
- [ ] Creativity: vibe-to-storefront experience for social-shareable eCommerce campaigns.
- [ ] Code quality: staged plan, typed models, server-side boundaries, README, docs, tests.
- [ ] Communication: 5-minute demo split between product flow and how the build was executed with Codex.
- [ ] Login and authorization: signed HTTP-only sessions, owner-only drafts, owner-only publish.
- [ ] MongoDB Atlas persistence: users, products, storefronts.
- [ ] Atlas auto-embedding: `product_vibe_autoembed` uses `autoEmbed` with `voyage-4`.
- [ ] No app embeddings: the app sends text queries and does not call Voyage directly.
- [ ] Codex SDK inside the running app: `POST /api/generate` calls `@openai/codex-sdk` server-side.
- [ ] Generated HTML safety: validation, iframe sandbox, and strict CSP.
- [ ] Tests: Vitest coverage plus Playwright browser smoke tests when the environment is seeded.

## Final Pre-Record Pass

- [ ] `npm test` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run test:e2e` passes when the local environment is seeded.
- [ ] `npm run build` passes.
- [ ] Demo user can log in.
- [ ] Primary vibe can generate a storefront.
- [ ] Publish returns a public URL.
- [ ] Public share page works after clearing cookies or opening a separate browser session.
