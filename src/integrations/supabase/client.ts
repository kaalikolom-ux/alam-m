import {
  executeD1Auth,
  executeD1Query,
  verifyJwt,
  type D1Filter,
  type D1Order,
  type D1QueryDescriptor,
} from "../d1/engine";

export interface User {
  id: string;
  aud: string;
  role: string;
  email?: string;
  email_confirmed_at?: string;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

const SESSION_STORAGE_KEY = "alam_m_d1_auth_session";

type AuthChangeCallback = (event: string, session: Session | null) => void;
const authListeners = new Set<AuthChangeCallback>();

function readStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function writeStoredSession(session: Session | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function notifyAuthListeners(event: string, session: Session | null): void {
  for (const cb of authListeners) {
    try {
      cb(event, session);
    } catch (err) {
      console.error("[D1 Auth] Listener error:", err);
    }
  }
}

async function runQueryDescriptor(
  descriptor: D1QueryDescriptor,
): Promise<{ data: any; error: any }> {
  // On the server (SSR / Cloudflare Worker), execute directly against Cloudflare D1
  if (typeof window === "undefined") {
    return executeD1Query(descriptor);
  }

  // In the browser, execute strictly against the Cloudflare Worker D1 endpoint
  const session = readStoredSession();
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (session?.access_token) {
    headers["authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch("/api/d1/query", {
    method: "POST",
    headers,
    body: JSON.stringify(descriptor),
  });

  if (!response.ok) {
    return {
      data: null,
      error: { message: `Cloudflare D1 query failed (${response.status})` },
    };
  }

  return (await response.json()) as { data: any; error: any };
}

async function runAuthAction(
  action: "signIn" | "signUp" | "updateUser" | "resetPassword" | "session",
  payload: { email?: string; password?: string; token?: string },
): Promise<{ data: any; error: any }> {
  if (typeof window === "undefined") {
    return executeD1Auth(action, payload);
  }

  const response = await fetch("/api/d1/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) {
    return {
      data: {},
      error: { message: `Cloudflare D1 auth failed (${response.status})` },
    };
  }

  return (await response.json()) as { data: any; error: any };
}

class D1QueryBuilder implements PromiseLike<{ data: any; error: any }> {
  private descriptor: D1QueryDescriptor;

  constructor(table: string) {
    this.descriptor = {
      table,
      operation: "select",
      select: "*",
      filters: [],
      orders: [],
      limit: null,
      single: null,
      values: undefined,
      returnSelect: null,
    };
  }

  select(columns = "*"): this {
    if (this.descriptor.operation === "insert" || this.descriptor.operation === "upsert") {
      this.descriptor.returnSelect = columns;
    } else {
      this.descriptor.operation = "select";
      this.descriptor.select = columns;
    }
    return this;
  }

  insert(values: unknown): this {
    this.descriptor.operation = "insert";
    this.descriptor.values = values;
    return this;
  }

  update(values: unknown): this {
    this.descriptor.operation = "update";
    this.descriptor.values = values;
    return this;
  }

  upsert(values: unknown): this {
    this.descriptor.operation = "upsert";
    this.descriptor.values = values;
    return this;
  }

  delete(): this {
    this.descriptor.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    (this.descriptor.filters as D1Filter[]).push({ type: "eq", column, value });
    return this;
  }

  neq(column: string, value: unknown): this {
    (this.descriptor.filters as D1Filter[]).push({ type: "neq", column, value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    (this.descriptor.filters as D1Filter[]).push({ type: "in", column, value: values });
    return this;
  }

  or(filterStr: string): this {
    (this.descriptor.filters as D1Filter[]).push({ type: "or", value: filterStr });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    (this.descriptor.orders as D1Order[]).push({
      column,
      ascending: options?.ascending !== false,
    });
    return this;
  }

  limit(count: number): this {
    this.descriptor.limit = count;
    return this;
  }

  single(): this {
    this.descriptor.single = "single";
    return this;
  }

  maybeSingle(): this {
    this.descriptor.single = "maybeSingle";
    return this;
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return runQueryDescriptor(this.descriptor).then(onfulfilled, onrejected);
  }
}

export const supabase = {
  from(table: string) {
    return new D1QueryBuilder(table);
  },
  auth: {
    async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
      const session = readStoredSession();
      return { data: { session }, error: null };
    },

    onAuthStateChange(callback: AuthChangeCallback) {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            },
          },
        },
      };
    },

    async signInWithPassword(credentials: { email: string; password: string }) {
      const res = await runAuthAction("signIn", credentials);
      if (res.error) {
        return { data: { user: null, session: null }, error: new Error(res.error.message) };
      }
      const session = (res.data?.session as Session) ?? null;
      writeStoredSession(session);
      notifyAuthListeners("SIGNED_IN", session);
      return {
        data: { user: session?.user ?? null, session },
        error: null,
      };
    },

    async signUp(credentials: { email: string; password: string; options?: unknown }) {
      const res = await runAuthAction("signUp", {
        email: credentials.email,
        password: credentials.password,
      });
      if (res.error) {
        return { data: { user: null, session: null }, error: new Error(res.error.message) };
      }
      const session = (res.data?.session as Session) ?? null;
      writeStoredSession(session);
      notifyAuthListeners("SIGNED_IN", session);
      return {
        data: { user: session?.user ?? null, session },
        error: null,
      };
    },

    async signOut() {
      writeStoredSession(null);
      notifyAuthListeners("SIGNED_OUT", null);
      return { error: null };
    },

    async resetPasswordForEmail(email: string, _options?: unknown) {
      const res = await runAuthAction("resetPassword", { email });
      if (res.error) {
        return { data: null, error: new Error(res.error.message) };
      }
      return { data: {}, error: null };
    },

    async updateUser(attributes: { password?: string }) {
      const session = readStoredSession();
      const res = await runAuthAction("updateUser", {
        password: attributes.password,
        token: session?.access_token,
      });
      if (res.error) {
        return { data: { user: null }, error: new Error(res.error.message) };
      }
      notifyAuthListeners("USER_UPDATED", session);
      return { data: { user: session?.user ?? null }, error: null };
    },

    async getClaims(token?: string) {
      const jwt = token || readStoredSession()?.access_token;
      if (!jwt) return { data: null, error: new Error("Missing token") };
      const claims = await verifyJwt(jwt);
      if (!claims) return { data: null, error: new Error("Invalid token") };
      return { data: { claims }, error: null };
    },
  },
};