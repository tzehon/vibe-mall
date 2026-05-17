# Vibe Mall 5-Minute Video Script

## Recording Goal

Show Vibe Mall as a working hackathon demo for a major eCommerce platform: a logged-in merchant types a vibe, the database finds products, Codex writes the storefront code, the app validates and sandboxes it, and the merchant publishes a shareable Mall URL.

The video has two halves:

1. Demo what was built.
2. Explain how it was planned and built with Codex.

## 0:00-0:20 - Hook

Screen: Vibe Mall landing page.

Voiceover:

> This mall writes itself.

Type or show the vibe:

```text
Pokemon style cute birthday
```

Voiceover:

> A merchant gives us a vibe. Vibe Mall turns that into a shoppable, themed micro-storefront backed by real product data.

Visual beats:

- Show the landing page hero.
- Briefly show the AI Assembly Line: database semantic search, Codex SDK, sandbox preview, public Mall URL.
- Cut quickly to a generated storefront preview.

## 0:20-0:55 - Why This Matters To eCommerce

Screen: landing page, then `/create`.

Voiceover:

> Major eCommerce platforms have massive catalogs, but campaign storefronts still take time: merchandising, creative direction, engineering, approvals, and launch work.
>
> Customers increasingly shop by mood, occasion, identity, and aesthetic. "Cute birthday gifts" or "clean desk refresh" is often closer to how people think than a rigid category tree.
>
> Vibe Mall combines semantic retrieval with Codex code generation. The database finds the right shelf from the catalog, then Codex writes a custom storefront for that exact vibe.

## 0:55-2:15 - Live Demo

Screen: `/login`.

Voiceover:

> First, this is a real logged-in flow. Drafts and publishing are tied to the merchant account.

Actions:

- Log in as the demo merchant.
- Go to `/create`.
- Enter:

```text
Pokemon style cute birthday
```

Screen: `/create`.

Voiceover:

> Now I click Generate with Codex. The app is doing the important work server-side.

Actions:

- Click **Generate with Codex**.
- Show the generation timeline as it advances.

Voiceover over timeline:

> The database searched the vibe space.
>
> Product matching uses semantic search, so the app sends text to the database and does not generate embeddings itself.
>
> The server sends the vibe and retrieved products to the Codex SDK.
>
> Codex returns one complete storefront code document.
>
> Code safety checks pass before the draft is saved to the database.

Screen: retrieved products and technical panel.

Voiceover:

> The product cards show what came back from retrieval, including categories, prices, tags, palettes, and product images. If I run in deterministic demo mode, the UI labels that clearly.

Screen: iframe preview.

Voiceover:

> The storefront preview is not React-rendered app UI. It is served through an embed route and displayed in a strict sandboxed iframe.

## 2:15-2:45 - Publish And Share

Screen: generated draft on `/create` or `/storefronts/[id]`.

Actions:

- Click **Publish to the Mall**.
- Show the success state on the details page.
- Confirm the sandboxed embed opens in a new tab.
- Copy or reopen the public storefront URL from the details page.
- Visit `/mall`.

Voiceover:

> Publishing changes the draft to a public storefront, opens the sandboxed embed in a new tab, keeps a stable share URL, and makes the storefront appear in the Mall gallery.
>
> Drafts are owner-only. Published storefronts are public.

## 2:45-3:45 - Technical Walkthrough

Screen: technical panel, source snippets if desired, then generated public page.

Voiceover:

> The persistence layer is MongoDB Atlas. The app stores users, products, and storefronts.
>
> Products have rich `searchText`, data-URI SVG images, category metadata, tags, prices, and palette data. The seed creates a visually reliable catalog for the demo.
>
> Product search uses MongoDB Atlas Vector Search against `products.searchText`. The index is `product_vibe_autoembed`, and it uses `autoEmbed` with `voyage-4`.
>
> The key point is that application code never calls Voyage and never sends `queryVector`. Atlas handles both document and query embeddings.
>
> The generation route is `POST /api/generate`. It runs in the Node.js runtime, requires auth, searches products, calls `@openai/codex-sdk` server-side, validates the generated code, then saves a draft storefront.
>
> Generated storefront code is treated as untrusted. Validation rejects scripts, iframes, forms, object/embed tags, inline event handlers, JavaScript URLs, external stylesheets, external fonts, external CSS asset URLs, and missing product names or prices.
>
> The generated document is returned only from `/storefronts/[id]/embed` with a restrictive Content Security Policy. The React app renders it only in an iframe with no scripts, no forms, and no same-origin privilege.

## 3:45-4:40 - How I Built This With Codex

Screen: `AGENTS.md`, `PLANS.md`, README, and app screens.

Voiceover:

> I started with a rough idea, but I was not sure how to describe it well. So I asked Codex to interview me first.
>
> That turned the fuzzy concept into a concrete plan: a storefront that codes itself, built in stages with specific prompts.
>
> I used `PLANS.md` as the living implementation plan and `AGENTS.md` as durable project guidance. As I learned what mattered, I folded those decisions back into the guidance: keep the README updated, use environment variables, keep secrets server-side, use the Codex SDK inside the running app, and do not use the Codex CLI from application code.
>
> Then I drove the build milestone by milestone: scaffolding, MongoDB and seed data, auth, Codex generation, sandboxed publishing, demo polish, tests, and this video package.
>
> To keep context clean, I also ran separate Codex sessions in parallel for independent work such as E2E tests, refactoring, and code review. That let the main thread stay focused on the product path while side sessions handled bounded tasks.

## 4:40-5:00 - Quality And Close

Screen: terminal test results, then final public storefront.

Voiceover:

> The project includes meaningful tests for HTML safety, auth and authorization, Atlas search pipeline shape, embed security, Codex demo mode, and Playwright browser smoke coverage.
>
> `CODEX_DEMO_MODE=true` gives a deterministic fallback for live demos and tests, while the default path uses the real Codex SDK when the environment is configured.
>
> The architecture has also been reviewed for open-source readiness: secrets stay in environment variables, generated artifacts are portable, and the docs call out setup, security, and demo-mode tradeoffs.
>
> An enterprise version could add brand controls, approval workflows, analytics, A/B testing, and merchant collaboration.

Close with:

> A shopper gives us the vibe. Semantic search finds the shelf. Codex builds the store.

## B-Roll And Cutaway Ideas

- The landing page AI Assembly Line.
- Login state changing in the navbar.
- The `/create` technical panel showing database semantic search, Codex SDK, code validation, iframe sandbox, and database persistence.
- Product cards with data-URI SVG product images.
- The iframe preview loading a generated storefront.
- The public Mall gallery after publishing.
- Terminal output for `npm test`, `npm run lint`, `npm run typecheck`, `npm run test:e2e`, and `npm run build`.

## Lines To Avoid

- Do not claim the app generates embeddings.
- Do not imply Codex only authored the repository. The running app has a live server-side Codex SDK path.
- Do not present `CODEX_DEMO_MODE=true` as the main production path. It is a deterministic fallback for tests and live-demo reliability.
- Do not show API keys, full MongoDB connection strings, or `.env.local` values on screen.
