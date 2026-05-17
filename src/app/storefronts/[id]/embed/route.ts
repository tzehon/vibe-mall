import { getCurrentUserFromRequest } from "@/lib/auth";
import { injectStorefrontFavicon } from "@/lib/storefrontFavicon";
import { findStorefrontForViewer } from "@/lib/storefronts";

type EmbedRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const EMBED_CSP = [
  "default-src 'none'",
  "img-src data:",
  "style-src 'unsafe-inline'",
  "script-src 'none'",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-ancestors 'self'"
].join("; ");

function embedHeaders(status: "draft" | "published") {
  return {
    "cache-control":
      status === "published" ? "public, max-age=300, s-maxage=600" : "no-store",
    "content-security-policy": EMBED_CSP,
    "content-type": "text/html; charset=utf-8"
  };
}

export async function GET(request: Request, { params }: EmbedRouteContext) {
  const { id } = await params;
  const user = await getCurrentUserFromRequest(request);
  const storefront = await findStorefrontForViewer(id, user);

  if (!storefront) {
    return new Response("Storefront not found.", {
      status: 404,
      headers: {
        "cache-control": "no-store",
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  if (!storefront.generatedHtml.trim()) {
    return new Response("Generated storefront code is not available.", {
      status: 404,
      headers: {
        "cache-control": "no-store",
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  return new Response(injectStorefrontFavicon(storefront.generatedHtml), {
    headers: embedHeaders(storefront.status)
  });
}
