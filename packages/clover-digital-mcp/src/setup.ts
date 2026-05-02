#!/usr/bin/env node
/**
 * Clover Digital MCP setup CLI.
 *
 * Usage:
 *   clover-digital-mcp-setup --email jasper@cloverdigital.com
 *
 * Starts a local callback server, sends a magic link to your Clover email,
 * and saves ~/.clover-digital/auth.json when you click the link.
 */
import { createClient, Session } from "@supabase/supabase-js";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { AddressInfo } from "node:net";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { saveAuthFile } from "./auth.js";

const CLOVER_OPS_SUPABASE_URL = "https://gfxpxkznqicbhbwlhply.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmeHB4a3pucWljYmhid2xocGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDA3NTAsImV4cCI6MjA5MzMxNjc1MH0.UCF1Bgu5nJYiwrnSMqt2Gu2fD3dw-huxYHQSfd6R884";
const LOCAL_CALLBACK_PORT = Number(process.env.CD_MCP_SETUP_PORT ?? "8787");
const CALLBACK_PATH = "/callback";

function parseArgs(): { email: string | null; mode: string; link: string | null } {
  let email: string | null = null;
  let link: string | null = null;
  let mode = "magic-link";
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--email" && process.argv[i + 1]) email = process.argv[++i] ?? null;
    if (a === "--paste") mode = "paste";
    if (a === "--link" && process.argv[i + 1]) {
      mode = "link";
      link = process.argv[++i] ?? null;
    }
  }
  return { email, mode, link };
}

async function magicLinkFlow(email: string): Promise<void> {
  const { url, anon } = getSupabaseConfig();
  const callback = await startLocalCallbackServer();
  const client = createClient(url, anon, {
    auth: {
      flowType: "implicit",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  console.log(`\nStarting local callback at ${callback.callbackUrl}`);
  console.log(`Sending magic link to ${email}...`);
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callback.callbackUrl,
    },
  });
  if (error) {
    callback.close();
    console.error(`\nERROR: ${error.message}`);
    process.exit(1);
  }

  console.log(`
[OK] Link sent. Open the email and click the magic link.

The CLI will save ~/.clover-digital/auth.json automatically when the browser
lands back on ${callback.callbackUrl}.

If the email link says the redirect URL is not allowed, ask a Clover admin to
add this Supabase Auth Redirect URL:
  http://127.0.0.1:${LOCAL_CALLBACK_PORT}${CALLBACK_PATH}

Fallbacks:
  clover-digital-mcp-setup --link "<fresh-full-magic-link-url>"
  clover-digital-mcp-setup --paste
`);

  try {
    await callback.done;
  } finally {
    callback.close();
  }
}

async function startLocalCallbackServer(): Promise<{
  callbackUrl: string;
  done: Promise<void>;
  close: () => void;
}> {
  let resolveDone!: () => void;
  let rejectDone!: (err: Error) => void;
  const done = new Promise<void>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const server = createServer(async (req, res) => {
    try {
      await handleCallbackRequest(req, res, resolveDone, rejectDone);
    } catch (err) {
      rejectDone(err as Error);
      sendText(res, 500, "Clover MCP setup failed. Return to the terminal.");
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", (err) => reject(err));
    server.listen(LOCAL_CALLBACK_PORT, "127.0.0.1", () => resolve());
  }).catch((err) => {
    throw new Error(
      `Could not start local callback on 127.0.0.1:${LOCAL_CALLBACK_PORT}: ` +
        `${(err as Error).message}\n` +
        `Either close the process using that port, set CD_MCP_SETUP_PORT, ` +
        `or use clover-digital-mcp-setup --link "<fresh-magic-link>".`,
    );
  });

  const address = server.address() as AddressInfo;
  const callbackUrl = `http://127.0.0.1:${address.port}${CALLBACK_PATH}`;
  return {
    callbackUrl,
    done,
    close: () => server.close(),
  };
}

async function handleCallbackRequest(
  req: IncomingMessage,
  res: ServerResponse,
  resolveDone: () => void,
  rejectDone: (err: Error) => void,
): Promise<void> {
  const requestUrl = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (req.method === "GET" && requestUrl.pathname === CALLBACK_PATH) {
    sendHtml(res, callbackHtml());
    return;
  }

  if (req.method === "POST" && requestUrl.pathname === "/session") {
    const body = await readBody(req);
    const payload = JSON.parse(body) as {
      access_token?: string;
      refresh_token?: string;
      error?: string;
      error_description?: string;
    };

    if (payload.error) {
      const message = payload.error_description ?? payload.error;
      rejectDone(new Error(message));
      sendJson(res, 400, { ok: false, message });
      return;
    }

    if (!payload.access_token || !payload.refresh_token) {
      rejectDone(new Error("Callback did not include Supabase session tokens."));
      sendJson(res, 400, { ok: false, message: "missing session tokens" });
      return;
    }

    const session = await validateSessionTokens(
      payload.access_token,
      payload.refresh_token,
    );
    persistSession(session);
    resolveDone();
    sendJson(res, 200, { ok: true, email: session.user?.email ?? null });
    return;
  }

  sendText(res, 404, "Not found");
}

function callbackHtml(): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Clover Digital MCP Setup</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 48px; color: #12382b; }
      main { max-width: 620px; }
      code { background: #eef5ee; padding: 2px 5px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Clover Digital MCP Setup</h1>
      <p id="status">Finishing sign in...</p>
    </main>
    <script>
      const status = document.getElementById('status');
      const params = new URLSearchParams(window.location.hash.slice(1));
      const payload = Object.fromEntries(params.entries());
      history.replaceState(null, '', window.location.pathname);
      fetch('/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) throw new Error(body.message || 'setup failed');
        status.textContent = 'Done. You can close this tab and return to the terminal.';
      }).catch((err) => {
        status.textContent = 'Setup failed: ' + err.message;
      });
    </script>
  </body>
</html>`;
}

async function validateSessionTokens(
  access_token: string,
  refresh_token: string,
): Promise<Session> {
  const { url, anon } = getSupabaseConfig();
  const client = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await client.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error || !data.session) {
    throw new Error(`Auth validation failed: ${error?.message ?? "no session"}`);
  }
  return data.session;
}

function persistSession(session: Session): void {
  saveAuthFile({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user_email: session.user?.email,
    user_id: session.user?.id,
    saved_at: new Date().toISOString(),
  });
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    if (Buffer.concat(chunks).length > 20_000) {
      throw new Error("Request body too large.");
    }
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendHtml(res: ServerResponse, html: string): void {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}

function sendJson(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}

function sendText(res: ServerResponse, status: number, text: string): void {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

async function pasteFlow(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });
  const raw = await rl.question(
    "Paste the auth-token JSON, a full magic-link URL, or just the refresh_token:\n> ",
  );
  rl.close();

  const trimmed = raw.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    await linkFlow(trimmed);
    return;
  }

  let access_token: string;
  let refresh_token: string;
  try {
    const parsed = JSON.parse(raw);
    const session = parsed.currentSession ?? parsed.session ?? parsed;
    access_token = session.access_token;
    refresh_token = session.refresh_token;
  } catch {
    // Treat as raw refresh token; refresh to get an access token.
    refresh_token = raw.trim();
    access_token = "";
  }

  if (!refresh_token) {
    console.error("ERROR: Couldn't find a refresh_token in that input.");
    process.exit(1);
  }

  const { url, anon } = getSupabaseConfig();
  const client = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const authResult = access_token
    ? await client.auth.setSession({ access_token, refresh_token })
    : await client.auth.refreshSession({ refresh_token });

  if (authResult.error || !authResult.data.session) {
    console.error(
      `ERROR: Auth validation failed: ${authResult.error?.message ?? "no session"}.\n` +
        `  Magic link may have expired or the refresh token was already used. ` +
        `Try setup --email again.`,
    );
    process.exit(1);
  }

  const { session } = authResult.data;
  persistSession(session);
  console.log(`[OK] Saved tokens to ~/.clover-digital/auth.json`);
  console.log(
    `  Now configure your MCP runtime to launch \`clover-digital-mcp\`.`,
  );
}

async function linkFlow(rawUrl: string): Promise<void> {
  let link: URL;
  try {
    link = new URL(rawUrl);
  } catch {
    console.error("ERROR: That does not look like a valid URL.");
    process.exit(1);
  }

  const token_hash = link.searchParams.get("token");
  const type = link.searchParams.get("type") ?? "magiclink";
  if (!token_hash) {
    console.error("ERROR: Couldn't find a token= parameter in that magic link.");
    process.exit(1);
  }

  const { url, anon } = getSupabaseConfig();
  const client = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await client.auth.verifyOtp({
    token_hash,
    type: type as "magiclink",
  });

  if (error || !data.session) {
    console.error(
      `ERROR: Magic-link redeem failed: ${error?.message ?? "no session"}.\n` +
        `  Use a fresh link and do not click it before running --link.`,
    );
    process.exit(1);
  }

  const { session } = data;
  persistSession(session);
  console.log(`[OK] Redeemed magic link and saved tokens to ~/.clover-digital/auth.json`);
}

async function main(): Promise<void> {
  const { email, mode, link } = parseArgs();
  if (mode === "link") {
    if (!link) {
      console.error("Usage: clover-digital-mcp-setup --link <full-magic-link-url>");
      process.exit(1);
    }
    await linkFlow(link);
    return;
  }
  if (mode === "paste") {
    await pasteFlow();
    return;
  }
  if (!email) {
    console.error(
      "Usage:\n" +
        "  clover-digital-mcp-setup --email <your-clover-email>\n" +
        "    (starts a local callback, sends a magic link, saves auth on click)\n" +
        "  clover-digital-mcp-setup --paste\n" +
        "    (paste tokens, a full magic link, or a refresh token)\n" +
        "  clover-digital-mcp-setup --link <full-magic-link-url>\n" +
        "    (redeems a fresh magic link without opening the dashboard)\n",
    );
    process.exit(1);
  }
  await magicLinkFlow(email);
}

main().catch((err) => {
  console.error(`Setup fatal: ${err}`);
  process.exit(1);
});

function getSupabaseConfig() {
  return {
    url:
      process.env.CLOVER_OPS_SUPABASE_URL ??
      process.env.CD_SUPABASE_URL ??
      CLOVER_OPS_SUPABASE_URL,
    anon:
      process.env.CLOVER_OPS_SUPABASE_ANON_KEY ??
      process.env.CLOVER_OPS_SUPABASE_PUBLISHABLE_KEY ??
      process.env.CD_SUPABASE_ANON_KEY ??
      FALLBACK_ANON_KEY,
  };
}
