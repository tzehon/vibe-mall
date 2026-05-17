import { ASSEMBLY_LINE_STEPS } from "@/lib/assembly-line";

export function AssemblyLine() {
  return (
    <section className="section" aria-labelledby="assembly-line-title">
      <div className="section-heading">
        <p className="eyebrow">AI Assembly Line</p>
        <h2 id="assembly-line-title">
          Type a trend. We find the products. Codex writes the storefront.
          Publish it to the Mall.
        </h2>
      </div>
      <div className="assembly-grid">
        {ASSEMBLY_LINE_STEPS.map((step) => (
          <article className="assembly-step" key={step.title}>
            <span className="step-number">{step.eyebrow}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
