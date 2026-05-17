import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <main className="page">
      <section className="panel not-found-panel">
        <p className="eyebrow">Storefront unavailable</p>
        <h1>This storefront is not public.</h1>
        <p className="lede">
          Published Trend Mall shelves are public. Drafts stay private to the
          merchant who created them.
        </p>
        <div className="button-row">
          <Link className="button primary" href="/mall">
            Browse the Mall
          </Link>
          <Link className="button secondary" href="/login?next=/mall">
            Log in
          </Link>
        </div>
      </section>
    </main>
  );
}
