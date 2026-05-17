import Link from "next/link";

import { getCurrentUser, sanitizeNextPath } from "@/lib/auth";
import { DEMO_USERS, DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from "@/lib/seed-data";

type LoginPageProps = {
  searchParams: Promise<{
    email?: string;
    error?: string;
    message?: string;
    next?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid: "That email and password did not match a seeded merchant.",
  missing: "Enter an email and password to sign in.",
  setup: "MongoDB or AUTH_SECRET is not configured yet. Add the env vars, run the seed, then try again."
};

const infoMessages: Record<string, string> = {
  auth_required: "Sign in to create and manage storefronts."
};

function demoPasswordForEmail(email: string | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();

  return DEMO_USERS.find((user) => user.email === normalizedEmail)?.password ?? DEMO_USER_PASSWORD;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const nextPath = sanitizeNextPath(params.next, "/create");
  const errorMessage = params.error ? errorMessages[params.error] : null;
  const infoMessage = params.message ? infoMessages[params.message] : null;
  const defaultEmail = params.email ?? DEMO_USER_EMAIL;
  const defaultPassword = demoPasswordForEmail(defaultEmail);

  return (
    <main className="page">
      <section className="two-column">
        <div>
          <p className="eyebrow">Demo merchant login</p>
          <h1>Sign in to publish storefronts.</h1>
          <p className="lede">
            Use either seeded merchant account to show owner-only drafts,
            publishing, and access-control boundaries.
          </p>
          <div className="panel credential-card">
            <h2>Seeded demo credentials</h2>
            <div className="credential-list">
              {DEMO_USERS.map((demoUser) => (
                <div className="credential-row" key={demoUser.email}>
                  <div>
                    <span>{demoUser.label}</span>
                    <p>
                      Email: <code>{demoUser.email}</code>
                    </p>
                    <p>
                      Password: <code>{demoUser.password}</code>
                    </p>
                  </div>
                  <form action="/api/auth/login" method="post">
                    <input name="next" type="hidden" value={nextPath} />
                    <input name="email" type="hidden" value={demoUser.email} />
                    <input name="password" type="hidden" value={demoUser.password} />
                    <button className="button secondary compact-button" type="submit">
                      Use account
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>
        {user ? (
          <div className="panel form-grid">
            <div className="notice success">Signed in as {user.email}.</div>
            <Link className="button primary" href={nextPath}>
              Continue
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="button secondary" type="submit">
                Logout
              </button>
            </form>
          </div>
        ) : (
          <form
            action="/api/auth/login"
            className="panel form-grid"
            method="post"
            aria-label="Demo merchant login form"
          >
            {infoMessage ? <div className="notice">{infoMessage}</div> : null}
            {errorMessage ? <div className="notice error">{errorMessage}</div> : null}
            <input name="next" type="hidden" value={nextPath} />
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                autoComplete="email"
                defaultValue={defaultEmail}
                id="email"
                name="email"
                placeholder={DEMO_USER_EMAIL}
                required
                type="email"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                autoComplete="current-password"
                defaultValue={defaultPassword}
                id="password"
                name="password"
                placeholder="Seeded password"
                required
                type="password"
              />
            </div>
            <button className="button primary" type="submit">
              Sign in
            </button>
            <p>
              Sessions are signed and stored in an HTTP-only cookie. Run{" "}
              <code>npm run seed</code> after configuring MongoDB to create these
              merchants.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
