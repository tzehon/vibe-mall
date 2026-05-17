import { spawn } from "node:child_process";
import path from "node:path";

function readArgValue(longName: string, shortName: string) {
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === longName || arg === shortName) {
      return args[index + 1];
    }

    if (arg.startsWith(`${longName}=`)) {
      return arg.slice(longName.length + 1);
    }
  }

  return undefined;
}

const host = readArgValue("--hostname", "-H") ?? "localhost";
const port = readArgValue("--port", "-p") ?? process.env.PORT ?? "3100";
const publicHost = host === "0.0.0.0" || host === "::" ? "localhost" : host;
const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const nextArgs = [nextBin, "dev", "--webpack", ...process.argv.slice(2)];
const child = spawn(process.execPath, nextArgs, {
  env: {
    ...process.env,
    CODEX_DEMO_MODE: "true",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? `http://${publicHost}:${port}`
  },
  stdio: "inherit"
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
