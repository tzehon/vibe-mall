export type AssemblyLineStep = {
  eyebrow: string;
  title: string;
  description: string;
};

export const ASSEMBLY_LINE_STEPS: AssemblyLineStep[] = [
  {
    eyebrow: "01",
    title: "Decide what you'd like to sell",
    description:
      "The trend becomes a text query. Vector Search handles semantic matching with automated embeddings."
  },
  {
    eyebrow: "02",
    title: "Codex SDK writes code",
    description:
      "The server passes the trend and retrieved product JSON to Codex, then receives one self-contained storefront."
  },
  {
    eyebrow: "03",
    title: "Sandboxed storefront preview",
    description:
      "Generated code is treated as untrusted and rendered only inside a restricted iframe."
  },
  {
    eyebrow: "04",
    title: "Public Mall URL",
    description:
      "A merchant can publish the generated page and share a stable storefront URL."
  }
];
