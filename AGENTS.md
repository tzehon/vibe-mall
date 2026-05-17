# Trend Mall Agent Guidance

## App Goal

Build a polished minimal end-to-end hackathon demo called **Trend Mall** for an OpenAI customer that runs a major eCommerce platform.

Trend Mall is a storefront that codes itself: a shopper types a trend such as `No wires clean desk refresh`, the app retrieves semantically matching products, asks Codex server-side to generate a themed storefront, renders the generated HTML safely, and lets the authenticated user publish and share it.

## Product Concept

The core user flow is:

1. User logs in.
2. User enters a shopping trend.
3. Server runs MongoDB Atlas Vector Search over a seeded product catalog.
4. Atlas uses Automated Embedding with `voyage-4`; the app must not generate embeddings itself.
5. Server calls Codex SDK or Codex as an MCP server with the trend and retrieved products.
6. Codex returns one self-contained themed HTML storefront.
7. App renders the generated HTML only in a sandboxed iframe.
8. User publishes the storefront to the Mall.
9. App saves the trend, selected products, generated HTML, owner, and public share slug in MongoDB Atlas.
10. Public visitors can open the shareable storefront URL.

## Non-Negotiable Requirements

- Login and authorization are required.
- MongoDB Atlas persistence is required.
- Product semantic search must use MongoDB Atlas Vector Search with Automated Embedding.
- The app must not generate product embeddings in application code.
- If embeddings are used, the Atlas search index must use `autoEmbed` with `voyage-4`.
- The running application itself must call Codex programmatically server-side through the Codex SDK or Codex as an MCP server.
- It is not enough that Codex authored the repository code.
- Generated storefront HTML must render only through a sandboxed iframe.
- Seed data must use data-URI SVG product images so the demo is visually reliable.
- Include a few meaningful tests.

## Architecture Constraints

- Preferred stack: Next.js App Router, TypeScript, MongoDB Node driver.
- The current folder is the app root. Do not create a nested `trend-mall` directory.
- Keep Codex calls server-side only. Do not expose Codex credentials to the browser.
- Keep MongoDB access server-side only except through app routes or server actions.
- Use simple credentials login for hackathon reliability.
- Store users, products, and storefronts in MongoDB.
- Keep generated storefront HTML self-contained so it can be persisted and shared without extra generated assets.
- Prefer a compact, polished demo surface over broad feature scope.

## Security Constraints

- Treat generated HTML as untrusted content.
- Render generated HTML only through an iframe with a restrictive `sandbox` attribute.
- Do not allow generated HTML to execute with same-origin privileges.
- Do not store or echo secrets into generated HTML.
- Validate ownership before listing, editing, publishing, or deleting a user's storefronts.
- Public share routes may read only published storefronts.
- Keep credentials and API keys in environment variables.
- Avoid adding broad HTML sanitization as a substitute for iframe sandboxing; the iframe boundary is required.

## MongoDB Atlas Auto-Embedding Constraint

- Atlas Vector Search must be configured to use Automated Embedding.
- The vector index must use `autoEmbed` with the `voyage-4` model.
- Application code must send query text to Atlas Vector Search and let Atlas perform embedding.
- Do not add an embedding SDK, embedding API call, or local embedding generation path in the app.
- Document Atlas index setup in project scripts or docs once implementation begins.

## Codex Inside-App Constraint

- The app must include a server-side generation route that calls Codex SDK or Codex as an MCP server at runtime.
- Codex input should include the user's trend and a bounded list of retrieved product records.
- Codex output should be constrained to a single complete HTML document or HTML fragment that is self-contained and safe to iframe.
- The generation route should persist the generation result under the authenticated user after successful creation or publish, depending on the final UX.

## Testing Expectations

- Add focused tests for authentication and authorization rules.
- Add focused tests for storefront generation route behavior with Codex mocked.
- Add focused tests for persistence and public/private storefront visibility.
- Add at least one check that generated storefront rendering uses a sandboxed iframe.
- Add seed/search tests where practical without depending on live Atlas in unit tests.
- Keep live Atlas/Codex validation as documented manual or integration checks when CI cannot access external services.

## Commands

Use these commands once they exist:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run seed
npm run atlas:index
npm run build
```

## Planning Discipline

- Complex work must read and follow `PLANS.md` before implementation.
- `PLANS.md` is the living implementation plan and must stay updated throughout implementation.
- Update `PLANS.md` when milestones progress, decisions change, surprises are discovered, validations are run, or acceptance criteria are met.
- Do not implement application features in planning-only stages.
- Keep README.md up to date throughout implementation, and make sure to include setup instructions, such as .env files, what to fill in, etc. Also be sure to mention how to run the unit tests.
- Make sure to use the Codex SDK, and not the CLI

## Definition of Done

The demo is done when:

- A user can log in with reliable demo credentials.
- Seeded products exist in MongoDB Atlas with reliable data-URI SVG images.
- Atlas Vector Search retrieves products through Automated Embedding using `autoEmbed` and `voyage-4`.
- The running app calls Codex server-side to generate a themed storefront from a trend and retrieved products.
- Generated HTML is rendered only in a sandboxed iframe.
- Authenticated users can save/publish generated storefronts.
- Published storefronts have public shareable URLs.
- Users cannot access or modify another user's private storefronts.
- Meaningful tests pass.
- The app is visually polished enough for a short hackathon demo.
- `PLANS.md` contains current progress, validation results, decisions, and demo checklist.
