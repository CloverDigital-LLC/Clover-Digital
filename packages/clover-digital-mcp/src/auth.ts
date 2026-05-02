/**
 * Per-user JWT auth for the Clover Digital MCP.
 *
 * Each teammate's MCP authenticates as their own auth.users row in the
 * Clover Ops Supabase project. All DB access flows through that JWT, so
 * RLS does the member/department gating while the MCP enforces friendly
 * shape rules like required department and duplicate checks.
 *
 * Tokens live at ~/.clover-digital/auth.json, populated by `clover-digital-mcp-setup`.
 */
import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

// Source of truth for the Clover Ops Supabase project.
const CLOVER_OPS_SUPABASE_URL = "https://gfxpxkznqicbhbwlhply.supabase.co";

// Publishable (anon) key - bundled in clients by design. RLS is the gate.
// Pull from env if set (lets us point at a staging project later); fall back
// to the production anon key.
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmeHB4a3pucWljYmhid2xocGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDA3NTAsImV4cCI6MjA5MzMxNjc1MH0.UCF1Bgu5nJYiwrnSMqt2Gu2fD3dw-huxYHQSfd6R884";

export const AUTH_FILE_PATH = join(homedir(), ".clover-digital", "auth.json");
const AUTH_LOCK_PATH = join(homedir(), ".clover-digital", "auth.lock");
const REFRESH_SKEW_SECONDS = 120;
const LOCK_STALE_MS = 30_000;
const LOCK_WAIT_MS = 100;
const LOCK_TIMEOUT_MS = 10_000;

export interface AuthFile {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user_email?: string;
  user_id?: string;
  saved_at?: string;
}

export function loadAuthFile(): AuthFile | null {
  if (!existsSync(AUTH_FILE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(AUTH_FILE_PATH, "utf8")) as AuthFile;
  } catch {
    return null;
  }
}

export function saveAuthFile(data: AuthFile): void {
  mkdirSync(dirname(AUTH_FILE_PATH), { recursive: true });
  // Mode 0600 - readable only by owner. Refresh tokens are long-lived.
  writeFileSync(AUTH_FILE_PATH, JSON.stringify(data, null, 2), { mode: 0o600 });
}

let client: SupabaseClient | null = null;

/**
 * Returns a SupabaseClient authenticated as the teammate. The accessToken
 * callback avoids supabase-js falling back to the anon key when a shared
 * refresh token has gone stale; refreshes are serialized through a lock file.
 */
export async function getClient(): Promise<SupabaseClient> {
  if (client) return client;

  const { url, anon } = getSupabaseConfig();

  client = createClient(url, anon, {
    accessToken: getValidAccessToken,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  await getValidAccessToken();
  return client;
}

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

function createAuthClient(): SupabaseClient {
  const { url, anon } = getSupabaseConfig();
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function getValidAccessToken(): Promise<string> {
  const auth = loadAuthFile();
  if (!auth) {
    throw new Error(
      `No auth file at ${AUTH_FILE_PATH}.\n` +
        `Run from packages/clover-digital-mcp: npm run setup -- --email <your-clover-email>`,
    );
  }

  if (isAccessTokenFresh(auth)) return auth.access_token;
  return refreshAuthFileWithLock();
}

function getAccessTokenExpiresAt(auth: AuthFile): number | null {
  if (auth.expires_at) return auth.expires_at;
  try {
    const [, payload] = auth.access_token.split(".");
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

function isAccessTokenFresh(auth: AuthFile): boolean {
  const expiresAt = getAccessTokenExpiresAt(auth);
  if (!expiresAt) return false;
  return expiresAt - Math.floor(Date.now() / 1000) > REFRESH_SKEW_SECONDS;
}

async function refreshAuthFileWithLock(): Promise<string> {
  await acquireAuthLock();
  try {
    const latest = loadAuthFile();
    if (!latest) {
      throw new Error(
        `No auth file at ${AUTH_FILE_PATH}.\n` +
          `Run from packages/clover-digital-mcp: npm run setup -- --email <your-clover-email>`,
      );
    }
    if (isAccessTokenFresh(latest)) return latest.access_token;
    if (!latest.refresh_token) {
      throw new Error(
        `Clover Digital auth file is missing refresh_token.\n` +
          `Re-run from packages/clover-digital-mcp: npm run setup -- --email <your-clover-email>`,
      );
    }

    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.refreshSession({
      refresh_token: latest.refresh_token,
    });
    if (error || !data.session) {
      throw new Error(
        `Clover Digital auth failed: ${error?.message ?? "no session returned"}\n` +
          `Re-run from packages/clover-digital-mcp: npm run setup -- --email <your-clover-email>`,
      );
    }
    persistSession(data.session);
    return data.session.access_token;
  } finally {
    releaseAuthLock();
  }
}

async function acquireAuthLock(): Promise<void> {
  const started = Date.now();
  mkdirSync(dirname(AUTH_LOCK_PATH), { recursive: true });
  while (true) {
    try {
      writeFileSync(AUTH_LOCK_PATH, `${process.pid}\n${new Date().toISOString()}\n`, {
        flag: "wx",
        mode: 0o600,
      });
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw err;
      try {
        const ageMs = Date.now() - statSync(AUTH_LOCK_PATH).mtimeMs;
        if (ageMs > LOCK_STALE_MS) rmSync(AUTH_LOCK_PATH, { force: true });
      } catch {
        rmSync(AUTH_LOCK_PATH, { force: true });
      }
      if (Date.now() - started > LOCK_TIMEOUT_MS) {
        throw new Error(
          `Timed out waiting for Clover Digital auth refresh lock at ${AUTH_LOCK_PATH}`,
        );
      }
      await sleep(LOCK_WAIT_MS);
    }
  }
}

function releaseAuthLock(): void {
  rmSync(AUTH_LOCK_PATH, { force: true });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

/**
 * Convenience: get the current authenticated user's email + Clover role.
 * Clover Ops uses cd_members instead of the old dashboard_role() RPC.
 */
export async function getCurrentUser(): Promise<{
  email: string | null;
  role: "admin" | "team" | null;
}> {
  const c = await getClient();
  const token = await getValidAccessToken();
  const { data: userData, error: userError } = await createAuthClient().auth.getUser(token);
  if (userError) throw userError;
  const user = userData.user;
  const email = user?.email ?? null;
  const userId = user?.id ?? null;
  let memberRole: string | null = null;

  if (userId) {
    const { data, error } = await c
      .from("cd_members")
      .select("role")
      .eq("auth_user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    memberRole = (data?.role as string | undefined) ?? null;
  }

  if (!memberRole && email) {
    const { data, error } = await c
      .from("cd_members")
      .select("role")
      .ilike("email", email)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw error;
    memberRole = (data?.role as string | undefined) ?? null;
  }

  const role =
    memberRole === "owner" || memberRole === "admin"
      ? "admin"
      : memberRole
        ? "team"
        : null;
  return { email, role };
}
