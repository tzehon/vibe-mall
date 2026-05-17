import Link from "next/link";

import { AssemblyLine } from "@/components/AssemblyLine";
import { StorefrontPreview } from "@/components/StorefrontPreview";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Trend Mall</p>
          <h1>A storefront that codes itself.</h1>
          <p className="lede hero-lede">
            Type a trend. We find the products. Codex writes the storefront.
            Publish it to the Mall.
          </p>
          <div className="home-signal-strip" aria-label="Why Trend Mall is useful">
            <div>
              <strong>Trend speed</strong>
              <span>Campaign shelves while the moment is hot.</span>
            </div>
            <div>
              <strong>Catalog aware</strong>
              <span>Real products, prices, images, and approval.</span>
            </div>
            <div>
              <strong>Share ready</strong>
              <span>A storefront link built for launch moments.</span>
            </div>
          </div>
          <div className="button-row">
            <Link className="button primary" href="/create">
              Create a storefront
            </Link>
            <Link className="button secondary" href="/mall">
              Browse the Mall
            </Link>
          </div>
        </div>
        <StorefrontPreview />
      </section>
      <section className="home-why-band">
        <div>
          <p className="eyebrow">Why it matters</p>
          <h2>Retail teams can catch a trend while it is still moving.</h2>
        </div>
        <p>
          Trend Mall turns a fuzzy merchandising idea into a reviewable, publishable shopping page:
          semantic product retrieval, Codex-generated code, strict sandbox preview, and one-click
          publishing in the same flow.
        </p>
      </section>
      <AssemblyLine />
    </main>
  );
}
