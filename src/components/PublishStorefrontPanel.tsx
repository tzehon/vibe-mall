"use client";

import { useState } from "react";

type PublishStatus = "draft" | "published";

type PublishResponse = {
  embedUrl: string;
  storefrontId: string;
  publicUrl: string;
  status: PublishStatus;
  error?: string;
};

export function PublishStorefrontPanel({
  canPublish,
  initialEmbedUrl,
  initialPublicUrl,
  initialStatus,
  storefrontId
}: {
  canPublish: boolean;
  initialEmbedUrl?: string;
  initialPublicUrl?: string;
  initialStatus: PublishStatus;
  storefrontId: string;
}) {
  const [status, setStatus] = useState<PublishStatus>(initialStatus);
  const [embedUrl, setEmbedUrl] = useState(initialEmbedUrl ?? "");
  const [publicUrl, setPublicUrl] = useState(initialPublicUrl ?? "");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function publish() {
    const launchedWindow = window.open("about:blank", "_blank");

    if (launchedWindow) {
      launchedWindow.opener = null;
    }

    setIsPublishing(true);
    setError(null);
    setLaunchMessage(null);

    try {
      const response = await fetch(`/api/storefronts/${storefrontId}/publish`, {
        method: "POST"
      });
      const payload = (await response.json()) as PublishResponse;

      if (!response.ok) {
        launchedWindow?.close();
        setError(payload.error ?? "Publishing failed.");
        return;
      }

      setStatus(payload.status);
      setEmbedUrl(payload.embedUrl);
      setPublicUrl(payload.publicUrl);
      setCopyState("idle");
      setLaunchMessage(
        launchedWindow
          ? "Published. Storefront opened in a new tab."
          : "Published. Open the storefront from here."
      );

      if (launchedWindow) {
        launchedWindow.location.href = payload.embedUrl;
      }
    } catch {
      launchedWindow?.close();
      setError("The publish request could not reach the server.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function copyPublicUrl() {
    if (!publicUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  if (status === "published") {
    return (
      <div className="publish-panel published">
        <div className="celebration-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">Published to the Mall</p>
        <h2>{launchMessage ?? "Share URL is live."}</h2>
        <p className="share-url">{publicUrl}</p>
        <div className="button-row">
          <button className="button secondary" onClick={copyPublicUrl} type="button">
            {copyState === "copied"
              ? "Copied"
              : copyState === "failed"
                ? "Copy failed"
                : "Copy URL"}
          </button>
          <a
            className="button primary"
            href={embedUrl || publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open storefront
          </a>
        </div>
      </div>
    );
  }

  if (!canPublish) {
    return null;
  }

  return (
    <div className="publish-panel">
      <p className="eyebrow">Draft controls</p>
      <h2>Publish this shelf when it is ready.</h2>
      <p>
        Publishing makes the storefront public in the Mall and creates a stable
        share URL.
      </p>
      <button className="button primary" disabled={isPublishing} onClick={publish} type="button">
        {isPublishing ? "Publishing..." : "Publish to the Mall"}
      </button>
      {error ? (
        <p className="notice error publish-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
