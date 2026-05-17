export function StorefrontPreview() {
  return (
    <div className="storefront-preview" aria-label="Generated storefront preview example">
      <div className="preview-toolbar">
        <span />
        <span />
        <span />
        <p>Generated storefront preview</p>
      </div>
      <div className="preview-hero">
        <div>
          <p className="preview-kicker">Vibe prompt</p>
          <h2>Quiet luxury airport essentials</h2>
        </div>
        <span className="preview-status">Ready to publish</span>
      </div>
      <div className="preview-shelf" aria-hidden="true">
        <div className="preview-product teal">
          <svg viewBox="0 0 120 120" role="img" aria-label="Compact carry-on">
            <rect className="product-shadow" x="31" y="97" width="58" height="8" rx="4" />
            <path className="product-line" d="M48 30v-7c0-5 4-9 9-9h6c5 0 9 4 9 9v7" />
            <rect className="product-fill" x="36" y="30" width="48" height="67" rx="9" />
            <path className="product-line" d="M51 42h18M51 54h18M51 66h18" />
            <circle className="product-dark" cx="45" cy="101" r="4" />
            <circle className="product-dark" cx="75" cy="101" r="4" />
          </svg>
        </div>
        <div className="preview-product coral">
          <svg viewBox="0 0 120 120" role="img" aria-label="Noise-canceling headphones">
            <rect className="product-shadow" x="28" y="96" width="64" height="8" rx="4" />
            <path className="product-line" d="M31 62c0-24 13-40 29-40s29 16 29 40" />
            <rect className="product-fill" x="22" y="58" width="24" height="34" rx="10" />
            <rect className="product-fill" x="74" y="58" width="24" height="34" rx="10" />
            <path className="product-line" d="M46 81h28" />
            <circle className="product-dark" cx="60" cy="82" r="5" />
          </svg>
        </div>
        <div className="preview-product ink">
          <svg viewBox="0 0 120 120" role="img" aria-label="Passport and travel pouch">
            <rect className="product-shadow" x="25" y="96" width="70" height="8" rx="4" />
            <rect className="product-fill" x="32" y="27" width="40" height="62" rx="6" />
            <path className="product-line" d="M44 43h16M44 76h16" />
            <circle className="product-line" cx="52" cy="59" r="9" />
            <rect className="product-accent" x="59" y="52" width="32" height="34" rx="7" />
            <path className="product-light" d="M67 64h16M67 74h11" />
          </svg>
        </div>
      </div>
      <p className="preview-note">
        We find the shelf, Codex writes the campaign, and the app previews
        the generated code in a strict sandbox before publishing.
      </p>
    </div>
  );
}
