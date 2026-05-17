"use client";

import type { FormEvent } from "react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  DEMO_SAMPLE_VIBES,
  GENERATION_TIMELINE_STEPS,
  getGenerationErrorCopy,
  type GenerationErrorCode
} from "@/lib/demoMetadata";

import { PublishStorefrontPanel } from "./PublishStorefrontPanel";

type GeneratedProduct = {
  _id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  palette: string[];
  imageDataUri: string;
  tags: string[];
  vectorSearchScore: number | null;
};

type GenerateResponse = {
  storefrontId: string;
  title: string;
  vibe: string;
  products: GeneratedProduct[];
  search: {
    mode: "atlas-auto-embedding" | "demo-fallback";
    usedFallback: boolean;
    indexName: string;
    path: string;
    model: string;
    reason?: string;
  };
  previewUrl: string;
  status: "draft";
};

type GenerateErrorPayload = {
  error?: string;
  errorCode?: GenerationErrorCode;
  step?: number;
};

type GenerateStreamEvent =
  | {
      event: "progress";
      data: {
        step: number;
        message: string;
        at: string;
      };
    }
  | {
      event: "code";
      data: {
        delta: string;
        totalLength: number;
        at: string;
      };
    }
  | {
      event: "done";
      data: GenerateResponse;
    }
  | {
      event: "error";
      data: GenerateErrorPayload;
    };

const WAITING_CODE_FLAVOR_TEXT = [
  "Measuring the vibe against the product shelf. Tiny tape measure, serious intent.",
  "Codex is picking a layout that will not embarrass the merchandise.",
  "Turning product JSON into something a shopper might actually scroll.",
  "Checking that the campaign has main-character energy and zero checkout liability.",
  "The code runway is being cleared. First tags should arrive shortly.",
  "Asking the products to stand in a neat grid and look natural about it."
] as const;

const WAITING_CODE_ASCII_FRAMES = [
  String.raw`+------------------------------------+
|  o                         []   () |
| /|\       ____        ____/  \____ |
| / \______/____\______/___________\ |
+------------------------------------+`,
  String.raw`+------------------------------------+
|   o                    []   ()     |
|  /|\      ____     ___/  \____     |
|  /  \____/____\___/___________\___ |
+------------------------------------+`,
  String.raw`+------------------------------------+
|  \o/              []   ()          |
|   |       ____ __/  \____          |
|  / \_____/____\____________\______ |
+------------------------------------+`,
  String.raw`+------------------------------------+
|   o          []   ()               |
|  /|\     ___/  \____          ____ |
| _/ \____/___________\________/____ |
+------------------------------------+`,
  String.raw`+------------------------------------+
|  o      []   ()                    |
| /|\ ___/  \____              ____  |
| / \/___________\____________/____\ |
+------------------------------------+`,
  String.raw`+------------------------------------+
|   o  ()                         [] |
|  /|\____          ____        _/  \|
|  / \___\_________/____\______/____ |
+------------------------------------+`
] as const;

function endlessRunnerFrame(frameIndex: number) {
  const score = String((frameIndex + 1) * 37).padStart(6, "0");
  const frame = WAITING_CODE_ASCII_FRAMES[frameIndex % WAITING_CODE_ASCII_FRAMES.length];

  return `VIBE RUNNER  SCORE ${score}\n${frame}`;
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

function ProductImage({ category, src }: { category: string; src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="product-image-fallback" aria-hidden="true">
        {category.slice(0, 3).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      alt=""
      height={104}
      onError={() => setFailed(true)}
      src={src}
      unoptimized
      width={104}
    />
  );
}

function parseSseFrame(frame: string): GenerateStreamEvent | null {
  const eventLine = frame
    .split("\n")
    .find((line) => line.startsWith("event:"))
    ?.slice("event:".length)
    .trim();
  const dataLines = frame
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim());

  if (!eventLine || dataLines.length === 0) {
    return null;
  }

  const parsedData = JSON.parse(dataLines.join("\n")) as GenerateStreamEvent["data"];

  if (
    eventLine === "progress" ||
    eventLine === "code" ||
    eventLine === "done" ||
    eventLine === "error"
  ) {
    return {
      event: eventLine,
      data: parsedData
    } as GenerateStreamEvent;
  }

  return null;
}

async function readGenerateStream({
  onCodeDelta,
  onProgress,
  stream
}: {
  onCodeDelta: (delta: string, totalLength: number) => void;
  onProgress: (step: number, message: string, at: string) => void;
  stream: ReadableStream<Uint8Array>;
}) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const event = parseSseFrame(frame);

      if (!event) {
        continue;
      }

      if (event.event === "progress") {
        onProgress(event.data.step, event.data.message, event.data.at);
      } else if (event.event === "code") {
        onCodeDelta(event.data.delta, event.data.totalLength);
      } else if (event.event === "done") {
        return event.data;
      } else {
        throw event.data;
      }
    }
  }

  throw {
    error: "The generation stream ended before the storefront was ready.",
    errorCode: "unknown"
  } satisfies GenerateErrorPayload;
}

function statusForStep({
  activeStep,
  error,
  index,
  isGenerating,
  result
}: {
  activeStep: number;
  error: GenerateErrorPayload | null;
  index: number;
  isGenerating: boolean;
  result: GenerateResponse | null;
}) {
  if (result) {
    return "complete";
  }

  if (error) {
    if (index < activeStep) {
      return "complete";
    }

    return index === activeStep ? "failed" : "idle";
  }

  if (isGenerating) {
    if (index < activeStep) {
      return "complete";
    }

    if (index === activeStep) {
      return "active";
    }
  }

  return "idle";
}

function timelineLabelForStatus({
  label,
  status
}: {
  label: (typeof GENERATION_TIMELINE_STEPS)[number];
  status: string;
}) {
  if (status === "complete") {
    return label.complete;
  }

  if (status === "active") {
    return label.active;
  }

  return label.idle;
}

function ProductRetrievalCards({
  products,
  usedFallback
}: {
  products: GeneratedProduct[];
  usedFallback: boolean;
}) {
  return (
    <div className="product-result-grid">
      {products.map((product) => (
        <article className="product-result-card polished-product-card" key={product._id}>
          <ProductImage category={product.category} src={product.imageDataUri} />
          <div>
            <div className="product-card-kicker">
              <span>{product.category}</span>
              {usedFallback ? <span className="fallback-label">Fallback mode</span> : null}
            </div>
            <h3>{product.name}</h3>
            <p>{product.brand}</p>
            <p>
              <strong>{formatPrice(product.price)}</strong>
            </p>
            <div className="tag-row" aria-label={`${product.name} tags`}>
              {product.tags.slice(0, 4).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function CreateStorefrontClient() {
  const [vibe, setVibe] = useState<string>(DEMO_SAMPLE_VIBES[0]);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<GenerateErrorPayload | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [timelineMessages, setTimelineMessages] = useState<Record<number, string>>({});
  const [generatedCodeSource, setGeneratedCodeSource] = useState("");
  const [waitingFrameIndex, setWaitingFrameIndex] = useState(0);
  const codeStreamRef = useRef<HTMLPreElement>(null);
  const errorCopy = error
    ? getGenerationErrorCopy(error.errorCode, error.error ?? "Storefront generation failed.")
    : null;
  const codeStreamState = isGenerating
    ? generatedCodeSource
      ? "streaming"
      : "waiting"
    : generatedCodeSource
      ? "complete"
      : "idle";
  const generatedCodeText =
    generatedCodeSource ||
    (isGenerating
      ? `${endlessRunnerFrame(waitingFrameIndex)}\n\n${
          WAITING_CODE_FLAVOR_TEXT[
            Math.floor(waitingFrameIndex / WAITING_CODE_ASCII_FRAMES.length) %
              WAITING_CODE_FLAVOR_TEXT.length
          ]
        }`
      : "Submit a vibe to stream the generated code here.");

  function updateVibe(nextVibe: string) {
    setVibe(nextVibe);
    setResult(null);
    setError(null);
  }

  useEffect(() => {
    const element = codeStreamRef.current;

    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [generatedCodeSource]);

  useEffect(() => {
    if (!isGenerating || generatedCodeSource) {
      return;
    }

    const interval = window.setInterval(() => {
      setWaitingFrameIndex((current) => current + 1);
    }, 650);

    return () => window.clearInterval(interval);
  }, [generatedCodeSource, isGenerating]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setActiveStep(0);
    setTimelineMessages({});
    setGeneratedCodeSource("");
    setWaitingFrameIndex(0);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          accept: "text/event-stream",
          "content-type": "application/json"
        },
        body: JSON.stringify({ vibe })
      });
      const contentType = response.headers.get("content-type") ?? "";

      if (response.ok && response.body && contentType.includes("text/event-stream")) {
        const streamedResult = await readGenerateStream({
          stream: response.body,
          onCodeDelta: (delta) => {
            setGeneratedCodeSource((current) => `${current}${delta}`);
          },
          onProgress: (step, message) => {
            setActiveStep(step);
            setTimelineMessages((current) => ({
              ...current,
              [step]: message
            }));
          }
        });

        setResult(streamedResult);
        return;
      }

      const payload = (await response.json()) as GenerateResponse & GenerateErrorPayload;

      if (!response.ok) {
        setError({
          error: payload.error ?? "Storefront generation failed.",
          errorCode:
            payload.errorCode ?? (response.status === 401 ? "auth_required" : "unknown")
        });
        return;
      }

      setResult(payload);
    } catch (streamError) {
      const payload = streamError as GenerateErrorPayload;

      if (typeof payload.step === "number") {
        setActiveStep(payload.step);
      }

      setError({
        error: payload.error ?? "The generation request could not reach the server.",
        errorCode: payload.errorCode ?? "mongodb_unavailable",
        step: payload.step
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="create-polish-layout">
      <section className="create-main">
        <div className="create-command panel">
          <p className="eyebrow">Create</p>
          <h1>Build the shelf from a vibe.</h1>
          <p className="lede">
            The app searches the catalog semantically, hands product JSON to
            Codex SDK, validates the generated code, then saves a draft that can
            be published to the Mall.
          </p>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field vibe-field">
              <label htmlFor="vibe">Vibe</label>
              <input
                id="vibe"
                maxLength={160}
                name="vibe"
                onChange={(event) => updateVibe(event.target.value)}
                placeholder="Pokemon style cute birthday"
                required
                type="text"
                value={vibe}
              />
            </div>
            <div>
              <p className="eyebrow">What&apos;s trending</p>
              <div className="chips" aria-label="Sample vibe prompts">
                {DEMO_SAMPLE_VIBES.map((sample) => (
                  <button
                    className="chip chip-button"
                    key={sample}
                    onClick={() => updateVibe(sample)}
                    type="button"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
            <button className="button primary generate-button" disabled={isGenerating} type="submit">
              {isGenerating ? "Assembly line running" : "Generate with Codex"}
            </button>
          </form>
        </div>

        <div className="generation-timeline panel" aria-live="polite">
          <div className="timeline-heading">
            <p className="eyebrow">Generation timeline</p>
            <h2>From vibe to publishable code</h2>
          </div>
          <ol className="timeline-list">
            {GENERATION_TIMELINE_STEPS.map((step, index) => {
              const status = statusForStep({
                activeStep,
                error,
                index,
                isGenerating,
                result
              });
              const isCurrent = isGenerating && index === activeStep;
              const message = timelineMessages[index];
              const label = timelineLabelForStatus({ label: step, status });

              return (
                <li className={`${status} ${isCurrent ? "current" : ""}`} key={step.complete}>
                  <span>{index + 1}</span>
                  <div className="timeline-copy">
                    <strong>{label}</strong>
                    {message && status !== "idle" ? <p>{message}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {result ? (
          <div className="launch-reveal" aria-label="Generated storefront reveal">
            <div>
              <p className="eyebrow">Vibe locked</p>
              <strong>{result.vibe}</strong>
            </div>
            <div>
              <p className="eyebrow">Shelf live</p>
              <strong>{result.title}</strong>
              <span>{result.products.length} products ready to shop</span>
            </div>
          </div>
        ) : null}

        {errorCopy ? (
          <div className="error-panel" role="alert">
            <p className="eyebrow">Recovery path</p>
            <h2>{errorCopy.title}</h2>
            <p>{errorCopy.description}</p>
            <p>
              <strong>Try this:</strong> {errorCopy.recovery}
            </p>
          </div>
        ) : null}
      </section>

      <aside className="technical-panel panel" aria-labelledby="generation-stream-title">
        <p className="eyebrow">Codex source stream</p>
        <h2 id="generation-stream-title">Generated code</h2>
        <div className={`generated-code-terminal is-${codeStreamState}`}>
          <div className="generated-code-titlebar" aria-hidden="true">
            <span className="terminal-dots">
              <span />
              <span />
              <span />
            </span>
            <span className="terminal-path">~/vibe-mall/generated-code</span>
            <span className="terminal-status">{codeStreamState}</span>
          </div>
          <pre
            className={`generated-code-stream ${generatedCodeSource ? "has-code" : "is-empty"}`}
            ref={codeStreamRef}
          >
            <code>{generatedCodeText}</code>
          </pre>
        </div>
      </aside>

      {result ? (
        <section className="generation-results polished-results">
          <div className="result-heading">
            <div>
              <p className="eyebrow">Draft saved</p>
              <h2>{result.title}</h2>
              <p>
                <span className="status-pill">Codex generated this code server-side</span>
                <span className="status-pill">iframe sandbox enabled</span>
              </p>
            </div>
            <a className="button secondary" href={`/storefronts/${result.storefrontId}`}>
              Open details page
            </a>
          </div>
          <PublishStorefrontPanel
            canPublish
            initialStatus={result.status}
            storefrontId={result.storefrontId}
          />

          <div className="retrieval-heading">
            <div>
              <p className="eyebrow">Retrieved products</p>
              <h2>{result.products.length} products matched the vibe</h2>
            </div>
            {result.search.usedFallback ? (
              <span className="fallback-banner">Using deterministic fallback search</span>
            ) : (
              <span className="fallback-banner live">Database semantic search</span>
            )}
          </div>
          <ProductRetrievalCards
            products={result.products}
            usedFallback={result.search.usedFallback}
          />

          <div className="iframe-shell large-preview-frame">
            <div className="preview-toolbar">
              <span />
              <span />
              <span />
              <p>Sandboxed generated storefront preview</p>
            </div>
            <iframe
              sandbox=""
              src={`/storefronts/${result.storefrontId}/embed`}
              title={`${result.title} generated storefront preview`}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
