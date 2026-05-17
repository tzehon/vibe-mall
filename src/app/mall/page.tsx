import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getOwnerStorefrontCards, getPublishedStorefrontCards } from "@/lib/storefronts";
import { getStorefrontSharePath } from "@/lib/storefrontUrls";

type StorefrontCard = Awaited<ReturnType<typeof getPublishedStorefrontCards>>[number];

function formatDate(date: Date | undefined) {
  if (!date) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium"
  }).format(date);
}

function StorefrontCards({
  emptyDescription,
  emptyTitle,
  storefronts,
  variant
}: {
  emptyDescription: string;
  emptyTitle: string;
  storefronts: StorefrontCard[];
  variant: "public" | "owner";
}) {
  if (storefronts.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Link className="button secondary" href="/create">
            Start from a vibe
          </Link>
        }
      />
    );
  }

  return (
    <div className="gallery-grid mall-gallery" aria-label="Storefronts">
      {storefronts.map((storefront) => (
        <article className="mall-card" key={storefront._id}>
          <div className="mall-card-art" aria-hidden="true">
            <span>{storefront.productCount}</span>
          </div>
          <div className="mall-card-header">
            <span className="status-pill">{storefront.status}</span>
            <span>{storefront.productCount} products</span>
          </div>
          <h2>{storefront.title}</h2>
          <p>{storefront.vibe}</p>
          <div className="mall-card-dates">
            <span>Created {formatDate(storefront.createdAt)}</span>
            {storefront.status === "published" ? (
              <span>Published {formatDate(storefront.publishedAt)}</span>
            ) : null}
          </div>
          {storefront.productNames.length > 0 ? (
            <p className="mall-card-products">
              {storefront.productNames.join(", ")}
              {storefront.productCount > storefront.productNames.length ? "..." : ""}
            </p>
          ) : null}
          <Link className="button secondary" href={getStorefrontSharePath(storefront)}>
            {variant === "owner" && storefront.status === "draft"
              ? "Preview draft"
              : "Open storefront"}
          </Link>
        </article>
      ))}
    </div>
  );
}

export default async function MallPage() {
  const user = await getCurrentUser();
  const [publicStorefronts, myStorefronts] = await Promise.all([
    getPublishedStorefrontCards(),
    user ? getOwnerStorefrontCards(user._id) : Promise.resolve([])
  ]);
  const myDrafts = myStorefronts.filter((storefront) => storefront.status === "draft");
  const myPublished = myStorefronts.filter((storefront) => storefront.status === "published");

  return (
    <main className="page mall-page">
      <section className="mall-hero">
        <div>
          <p className="eyebrow">Public Mall</p>
          <h1>Storefronts that started as vibes.</h1>
          <p className="lede">
            Published shelves appear here as social-shareable campaigns.
            Private drafts stay in the merchant workspace until they are ready.
          </p>
        </div>
        <div className="mall-hero-metrics" aria-label="Mall metrics">
          <div>
            <strong>{publicStorefronts.length}</strong>
            <span>public shelves</span>
          </div>
          <div>
            <strong>{myDrafts.length}</strong>
            <span>your drafts</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Public</p>
          <h2>All published storefronts</h2>
          <p>Every published shelf appears here, including storefronts shared by your account.</p>
        </div>
        <StorefrontCards
          storefronts={publicStorefronts}
          variant="public"
          emptyTitle="No public storefronts yet."
          emptyDescription="Published storefronts from any merchant will appear here after they are generated and shared."
        />
      </section>

      {user ? (
        <>
          <section className="section" aria-labelledby="my-drafts-title">
            <div className="section-heading">
              <p className="eyebrow">Your workspace</p>
              <h2 id="my-drafts-title">Private drafts</h2>
              <p>Drafts are visible only to you until you publish them.</p>
            </div>
            <StorefrontCards
              storefronts={myDrafts}
              variant="owner"
              emptyTitle="No private drafts."
              emptyDescription="Generate a vibe storefront and the draft will appear here before publishing."
            />
          </section>
          {myPublished.length > 0 ? (
            <section className="section" aria-labelledby="my-published-title">
              <div className="section-heading">
                <p className="eyebrow">Your published storefronts</p>
                <h2 id="my-published-title">Shared by you</h2>
                <p>These are already public and also appear in the gallery above.</p>
              </div>
              <StorefrontCards
                storefronts={myPublished}
                variant="owner"
                emptyTitle="Nothing published from your account yet."
                emptyDescription="Publish a draft when it is ready for the public Mall."
              />
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
