import Link from "next/link";

import { SiteHeaderNav } from "@/components/SiteHeaderNav";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Vibe Mall home">
        <span className="brand-mark" aria-hidden="true">
          VM
        </span>
        <span>
          <strong>Vibe Mall</strong>
          <small>Storefronts that code themselves</small>
        </span>
      </Link>
      <SiteHeaderNav user={user} />
    </header>
  );
}
