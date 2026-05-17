import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { getCurrentUserFromRequest } from "@/lib/auth";
import { generateStorefrontHtmlWithCodex } from "@/lib/codex/generateStorefrontHtml";
import { CODEX_PRODUCT_LIMIT } from "@/lib/generationConfig";
import { getDb } from "@/lib/mongodb";
import type { ProductSnapshot, Storefront } from "@/lib/models";
import { searchProductsByVibe } from "@/lib/productSearch";
import type { ProductSearchResult } from "@/lib/productSearch";
import { validateGeneratedStorefrontHtml } from "@/lib/htmlSafety";
import type { GenerationErrorCode } from "@/lib/demoMetadata";

export const runtime = "nodejs";

const generateRequestSchema = z.object({
  vibe: z.string().trim().min(3, "Type a vibe before generating.").max(160)
});

type GeneratePayload = {
  storefrontId: string;
  title: string;
  vibe: string;
  products: ReturnType<typeof responseProduct>[];
  search: Awaited<ReturnType<typeof searchProductsByVibe>>["metadata"];
  previewUrl: string;
  status: "draft";
};

type ProgressEmitter = (step: number, message: string) => void;
type CodeEmitter = (delta: string, totalLength: number) => void;

class GenerateRouteError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorCode: GenerationErrorCode,
    readonly step: number
  ) {
    super(message);
    this.name = "GenerateRouteError";
  }
}

function jsonError(message: string, status: number, errorCode: GenerationErrorCode) {
  return NextResponse.json({ error: message, errorCode }, { status });
}

function routeError(
  message: string,
  status: number,
  errorCode: GenerationErrorCode,
  step: number
) {
  return new GenerateRouteError(message, status, errorCode, step);
}

function classifySearchError(error: unknown): GenerationErrorCode {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("mongodb_uri") || message.includes("mongodb_db")) {
    return "mongodb_unavailable";
  }

  return "atlas_unavailable";
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 58)
    .replace(/-+$/g, "");

  return slug || "vibe-mall-storefront";
}

function fallbackTitle(vibe: string) {
  const titleWords = vibe
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");

  return `${titleWords || "Vibe Mall"} Shelf`;
}

function productIdFromResult(product: ProductSearchResult) {
  if (!ObjectId.isValid(product._id)) {
    throw new Error(`Product ${product.sku} has an invalid MongoDB _id.`);
  }

  return new ObjectId(product._id);
}

function snapshotProduct(product: ProductSearchResult): ProductSnapshot {
  return {
    _id: productIdFromResult(product),
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    palette: product.palette,
    imageDataUri: product.imageDataUri,
    tags: product.tags,
    searchText: product.searchText
  };
}

function responseProduct(product: ProductSearchResult) {
  return {
    _id: product._id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    palette: product.palette,
    imageDataUri: product.imageDataUri,
    tags: product.tags,
    vectorSearchScore: product.vectorSearchScore
  };
}

function appBaseUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin).replace(
    /\/+$/,
    ""
  );
}

function wantsProgressStream(request: Request) {
  return request.headers.get("accept")?.includes("text/event-stream") ?? false;
}

async function runGenerationWorkflow({
  emit,
  emitCode,
  request,
  user,
  vibe
}: {
  emit: ProgressEmitter;
  emitCode?: CodeEmitter;
  request: Request;
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUserFromRequest>>>;
  vibe: string;
}): Promise<GeneratePayload> {
  console.info("[generate] starting storefront generation", {
    userId: user._id,
    vibeLength: vibe.length
  });

  emit(0, `Searching the catalog for "${vibe}".`);

  let search: Awaited<ReturnType<typeof searchProductsByVibe>>;

  try {
    search = await searchProductsByVibe(vibe, CODEX_PRODUCT_LIMIT);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown product search error.";
    const errorCode = classifySearchError(error);

    console.error("[generate] product search failed", {
      errorCode,
      message
    });

    throw routeError(
      errorCode === "mongodb_unavailable"
        ? "MongoDB Atlas is unavailable, so the app could not read product records."
        : "Atlas Vector Search is unavailable or the product_vibe_autoembed index is not ready.",
      503,
      errorCode,
      0
    );
  }

  if (search.results.length === 0) {
    throw routeError(
      "Atlas did not return matching products for that vibe. Try a more specific mood, occasion, or product style.",
      404,
      "no_products",
      1
    );
  }

  console.info("[generate] products retrieved", {
    count: search.results.length,
    mode: search.metadata.mode,
    usedFallback: search.metadata.usedFallback
  });

  emit(
    1,
    `Retrieved ${search.results.length} products using ${
      search.metadata.usedFallback ? "deterministic fallback search" : "database semantic search"
    }.`
  );
  emit(2, "Sending the vibe and product JSON to Codex SDK.");

  let generation;
  let streamedCodeLength = 0;
  const emitCodeDelta = emitCode
    ? (delta: string, totalLength: number) => {
        streamedCodeLength = totalLength;
        emitCode(delta, totalLength);
      }
    : undefined;

  try {
    generation = await generateStorefrontHtmlWithCodex({
      onCodeDelta: emitCodeDelta,
      onProgress: (message) => emit(2, message),
      vibe,
      products: search.results
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Codex generation error.";

    console.error("[generate] Codex generation failed", {
      message
    });

    throw routeError(
      "Codex generation failed before code could be validated.",
      502,
      "codex_failed",
      2
    );
  }

  if (emitCode && generation.html.length > streamedCodeLength) {
    emitCode(generation.html.slice(streamedCodeLength), generation.html.length);
  }

  emit(3, `Codex returned ${generation.html.length.toLocaleString()} characters of code.`);

  const validation = validateGeneratedStorefrontHtml({
    html: generation.html,
    products: search.results,
    fallbackTitle: fallbackTitle(vibe)
  });

  if (!validation.ok) {
    console.warn("[generate] Codex output rejected", {
      reason: validation.error,
      productCount: search.results.length
    });

    throw routeError(validation.error, 422, "html_safety_failed", 3);
  }

  emit(4, "Code passed safety checks. Saving the draft and product snapshot.");

  try {
    const db = await getDb();
    const storefrontId = new ObjectId();
    const title = validation.title;
    const slug = `${slugify(title)}-${storefrontId.toHexString().slice(-8)}`;
    const productIds = search.results.map(productIdFromResult);
    const productsSnapshot = search.results.map(snapshotProduct);
    const now = new Date();
    const storefront: Storefront = {
      _id: storefrontId,
      ownerId: new ObjectId(user._id),
      vibe,
      title,
      slug,
      productIds,
      productsSnapshot,
      generatedHtml: validation.html,
      codexThreadId: generation.codexThreadId,
      status: "draft",
      createdAt: now
    };

    await db.collection<Storefront>("storefronts").insertOne(storefront);

    console.info("[generate] draft storefront saved", {
      storefrontId: storefrontId.toHexString(),
      productCount: productIds.length,
      codexThreadId: generation.codexThreadId ?? null
    });

    emit(5, `Draft saved as "${title}". Preview is ready.`);

    return {
      storefrontId: storefrontId.toHexString(),
      title,
      vibe,
      products: search.results.map(responseProduct),
      search: search.metadata,
      previewUrl: `${appBaseUrl(request)}/storefronts/${storefrontId.toHexString()}/embed`,
      status: "draft"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB persistence error.";

    console.error("[generate] draft save failed", {
      message
    });

    throw routeError(
      "MongoDB Atlas is unavailable, so the validated storefront could not be saved.",
      503,
      "mongodb_unavailable",
      4
    );
  }
}

function streamGeneration({
  request,
  user,
  vibe
}: {
  request: Request;
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUserFromRequest>>>;
  vibe: string;
}) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        function send(event: string, data: unknown) {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        }

        try {
          const payload = await runGenerationWorkflow({
            emit: (step, message) =>
              send("progress", {
                step,
                message,
                at: new Date().toISOString()
              }),
            emitCode: (delta, totalLength) =>
              send("code", {
                delta,
                totalLength,
                at: new Date().toISOString()
            }),
            request,
            user,
            vibe
          });

          send("done", payload);
        } catch (error) {
          const routeFailure =
            error instanceof GenerateRouteError
              ? error
              : routeError("Storefront generation failed.", 500, "unknown", 0);

          send("error", {
            error: routeFailure.message,
            errorCode: routeFailure.errorCode,
            step: routeFailure.step
          });
        } finally {
          controller.close();
        }
      }
    }),
    {
      headers: {
        "Cache-Control": "no-store",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no"
      }
    }
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return jsonError("Authentication required.", 401, "auth_required");
  }

  if (!ObjectId.isValid(user._id)) {
    return jsonError(
      "Authentication session is invalid. Please log in again.",
      401,
      "auth_required"
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Send a JSON body with a vibe to generate.", 400, "invalid_request");
  }

  const parsed = generateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid generation request.",
      400,
      "invalid_request"
    );
  }

  const { vibe } = parsed.data;

  try {
    if (wantsProgressStream(request)) {
      return streamGeneration({ request, user, vibe });
    }

    const payload = await runGenerationWorkflow({
      emit: () => {},
      request,
      user,
      vibe
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof GenerateRouteError) {
      return jsonError(error.message, error.status, error.errorCode);
    }

    throw error;
  }
}
