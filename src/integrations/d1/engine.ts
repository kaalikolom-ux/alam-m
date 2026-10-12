import { INITIAL_SEED_DATA } from "./seed-data";

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
  exec(query: string): Promise<unknown>;
}

export interface D1Filter {
  type: "eq" | "neq" | "in" | "or";
  column?: string;
  value?: unknown;
}

export interface D1Order {
  column: string;
  ascending: boolean;
}

export interface D1QueryDescriptor {
  table: string;
  operation: "select" | "insert" | "update" | "upsert" | "delete";
  select?: string;
  filters?: D1Filter[];
  orders?: D1Order[];
  limit?: number | null;
  single?: "single" | "maybeSingle" | null;
  values?: unknown;
  returnSelect?: string | null;
}

const ADMIN_EMAILS = new Set([
  "notabene.inc@gmail.com",
  "kaali.kolom@gmail.com",
]);

const TABLE_COLUMNS: Record<string, string[]> = {
  users: ["id", "email", "password_hash", "display_name", "created_at", "updated_at"],
  profiles: ["id", "email", "display_name", "created_at"],
  user_roles: ["id", "user_id", "role", "created_at"],
  authors: ["id", "name_bn", "name_en", "image_url", "bio_bn", "bio_en", "created_at", "updated_at"],
  categories: ["id", "slug", "name_bn", "name_en", "description_bn", "created_at", "updated_at"],
  articles: [
    "id",
    "slug",
    "title_bn",
    "title_en",
    "excerpt_bn",
    "excerpt_en",
    "content_bn",
    "content_en",
    "cover_image_url",
    "published",
    "published_at",
    "created_by",
    "author_id",
    "created_at",
    "updated_at",
  ],
  article_categories: ["article_id", "category_id", "created_at"],
  pages: [
    "id",
    "slug",
    "title_bn",
    "title_en",
    "content_bn",
    "content_en",
    "cover_image_url",
    "published",
    "created_by",
    "created_at",
    "updated_at",
  ],
  menu_items: [
    "id",
    "label_bn",
    "label_en",
    "url",
    "location",
    "sort_order",
    "visible",
    "created_at",
    "updated_at",
  ],
  site_settings: [
    "id",
    "footer_about_bn",
    "footer_about_en",
    "footer_copyright_bn",
    "footer_copyright_en",
    "created_at",
    "updated_at",
  ],
  bookmarks: ["id", "user_id", "kind", "surah", "ayah", "article_id", "label", "note", "created_at"],
  contact_messages: ["id", "name", "email", "subject", "message", "created_at"],
  newsletter_subscribers: ["id", "email", "created_at"],
  verse_translations: [
    "id",
    "surah",
    "ayah",
    "lang",
    "text",
    "note",
    "created_by",
    "created_at",
    "updated_at",
  ],
};

const BOOLEAN_COLUMNS: Record<string, string[]> = {
  articles: ["published"],
  pages: ["published"],
  menu_items: ["visible"],
};

const TABLES_WITH_UPDATED_AT = new Set([
  "users",
  "authors",
  "categories",
  "articles",
  "pages",
  "menu_items",
  "site_settings",
  "verse_translations",
]);

let activeD1Database: D1Database | null = null;
const initializedDbs = new WeakSet<D1Database>();

export function setWorkerEnv(env: unknown): void {
  if (!env || typeof env !== "object") return;
  const record = env as Record<string, unknown>;
  for (const key of ["DB", "alam-m", "alam_m", "D1", "d1"]) {
    const candidate = record[key];
    if (candidate && typeof (candidate as D1Database).prepare === "function") {
      activeD1Database = candidate as D1Database;
      return;
    }
  }
  // Also scan any property on env that looks like a D1Database binding
  for (const val of Object.values(record)) {
    if (val && typeof (val as D1Database).prepare === "function") {
      activeD1Database = val as D1Database;
      return;
    }
  }
}

export function getActiveD1Database(): D1Database | null {
  return activeD1Database;
}

// In-memory fallback store when running locally without wrangler D1 binding
const memoryStore: Record<string, Record<string, unknown>[]> = {
  users: [],
  profiles: [],
  user_roles: [],
  authors: structuredClone((INITIAL_SEED_DATA.authors as unknown as Record<string, unknown>[]) || []),
  categories: structuredClone((INITIAL_SEED_DATA.categories as unknown as Record<string, unknown>[]) || []),
  articles: structuredClone((INITIAL_SEED_DATA.articles as unknown as Record<string, unknown>[]) || []),
  article_categories: structuredClone(
    (INITIAL_SEED_DATA.article_categories as unknown as Record<string, unknown>[]) || [],
  ),
  pages: structuredClone((INITIAL_SEED_DATA.pages as unknown as Record<string, unknown>[]) || []),
  menu_items: structuredClone((INITIAL_SEED_DATA.menu_items as unknown as Record<string, unknown>[]) || []),
  site_settings: structuredClone((INITIAL_SEED_DATA.site_settings as unknown as Record<string, unknown>[]) || []),
  bookmarks: [],
  contact_messages: [],
  newsletter_subscribers: [],
  verse_translations: [],
};

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, role)
  )`,
  `CREATE TABLE IF NOT EXISTS authors (
    id TEXT PRIMARY KEY,
    name_bn TEXT NOT NULL,
    name_en TEXT,
    image_url TEXT,
    bio_bn TEXT,
    bio_en TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_bn TEXT NOT NULL,
    name_en TEXT,
    description_bn TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title_bn TEXT NOT NULL,
    title_en TEXT,
    excerpt_bn TEXT,
    excerpt_en TEXT,
    content_bn TEXT,
    content_en TEXT,
    cover_image_url TEXT,
    published INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    created_by TEXT,
    author_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS article_categories (
    article_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (article_id, category_id)
  )`,
  `CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title_bn TEXT NOT NULL,
    title_en TEXT,
    content_bn TEXT,
    content_en TEXT,
    cover_image_url TEXT,
    published INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    label_bn TEXT NOT NULL,
    label_en TEXT,
    url TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'header',
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY,
    footer_about_bn TEXT,
    footer_about_en TEXT,
    footer_copyright_bn TEXT,
    footer_copyright_en TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'article',
    surah INTEGER,
    ayah INTEGER,
    article_id TEXT,
    label TEXT,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS verse_translations (
    id TEXT PRIMARY KEY,
    surah INTEGER NOT NULL,
    ayah INTEGER NOT NULL,
    lang TEXT NOT NULL,
    text TEXT NOT NULL,
    note TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (surah, ayah, lang)
  )`,
];

async function ensureD1Initialized(db: D1Database): Promise<void> {
  if (initializedDbs.has(db)) return;
  try {
    const ddlBatch = DDL_STATEMENTS.map((sql) => db.prepare(sql));
    await db.batch(ddlBatch);

    // Check if initial seed data needs to be populated
    const existingCount = await db
      .prepare("SELECT COUNT(*) as cnt FROM categories")
      .first<{ cnt: number }>();

    if (!existingCount || Number(existingCount.cnt) === 0) {
      const seedStmts: D1PreparedStatement[] = [];

      for (const a of INITIAL_SEED_DATA.authors || []) {
        seedStmts.push(
          db
            .prepare(
              "INSERT OR IGNORE INTO authors (id, name_bn, name_en, image_url, bio_bn, bio_en, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(a.id, a.name_bn, a.name_en, a.image_url, a.bio_bn, a.bio_en, a.created_at, a.updated_at),
        );
      }
      for (const c of INITIAL_SEED_DATA.categories || []) {
        seedStmts.push(
          db
            .prepare(
              "INSERT OR IGNORE INTO categories (id, slug, name_bn, name_en, description_bn, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(c.id, c.slug, c.name_bn, c.name_en, c.description_bn, c.created_at, c.updated_at),
        );
      }
      for (const art of INITIAL_SEED_DATA.articles || []) {
        seedStmts.push(
          db
            .prepare(
              "INSERT OR IGNORE INTO articles (id, slug, title_bn, title_en, excerpt_bn, excerpt_en, content_bn, content_en, cover_image_url, published, published_at, created_by, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              art.id,
              art.slug,
              art.title_bn,
              art.title_en,
              art.excerpt_bn,
              art.excerpt_en,
              art.content_bn,
              art.content_en,
              art.cover_image_url,
              art.published ? 1 : 0,
              art.published_at,
              art.created_by,
              art.author_id,
              art.created_at,
              art.updated_at,
            ),
        );
      }
      for (const ac of INITIAL_SEED_DATA.article_categories || []) {
        seedStmts.push(
          db
            .prepare(
              "INSERT OR IGNORE INTO article_categories (article_id, category_id, created_at) VALUES (?, ?, ?)",
            )
            .bind(ac.article_id, ac.category_id, ac.created_at),
        );
      }
      for (const p of INITIAL_SEED_DATA.pages || []) {
        seedStmts.push(
          db
            .prepare(
              "INSERT OR IGNORE INTO pages (id, slug, title_bn, title_en, content_bn, content_en, cover_image_url, published, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              p.id,
              p.slug,
              p.title_bn,
              p.title_en,
              p.content_bn,
              p.content_en,
              p.cover_image_url,
              p.published ? 1 : 0,
              p.created_by,
              p.created_at,
              p.updated_at,
            ),
        );
      }
      for (const m of INITIAL_SEED_DATA.menu_items || []) {
        seedStmts.push(
          db
            .prepare(
              "INSERT OR IGNORE INTO menu_items (id, label_bn, label_en, url, location, sort_order, visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              m.id,
              m.label_bn,
              m.label_en,
              m.url,
              m.location,
              m.sort_order,
              m.visible ? 1 : 0,
              m.created_at,
              m.updated_at,
            ),
        );
      }
      for (const s of INITIAL_SEED_DATA.site_settings || []) {
        seedStmts.push(
          db
            .prepare(
              "INSERT OR IGNORE INTO site_settings (id, footer_about_bn, footer_about_en, footer_copyright_bn, footer_copyright_en, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              s.id,
              s.footer_about_bn,
              s.footer_about_en,
              s.footer_copyright_bn,
              s.footer_copyright_en,
              s.created_at,
              s.updated_at,
            ),
        );
      }
      if (seedStmts.length > 0) {
        await db.batch(seedStmts);
      }
    }
    initializedDbs.add(db);
  } catch (err) {
    console.error("[D1] Failed to initialize schema/seed:", err);
  }
}

function normalizeRowFromSqlite(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...row };
  const boolCols = BOOLEAN_COLUMNS[table];
  if (boolCols) {
    for (const col of boolCols) {
      if (col in copy) {
        copy[col] = copy[col] === 1 || copy[col] === true || copy[col] === "1";
      }
    }
  }
  return copy;
}

function toSqliteValue(table: string, col: string, val: unknown): unknown {
  if (val === undefined) return null;
  const boolCols = BOOLEAN_COLUMNS[table];
  if (boolCols && boolCols.includes(col)) {
    return val ? 1 : 0;
  }
  if (typeof val === "boolean") {
    return val ? 1 : 0;
  }
  return val;
}

function buildWhereClause(
  table: string,
  filters: D1Filter[] = [],
): { clause: string; params: unknown[] } {
  const validCols = new Set(TABLE_COLUMNS[table] || []);
  const clauses: string[] = [];
  const params: unknown[] = [];

  for (const f of filters) {
    if (f.type === "eq" && f.column && validCols.has(f.column)) {
      if (f.value === null) {
        clauses.push(`${f.column} IS NULL`);
      } else {
        clauses.push(`${f.column} = ?`);
        params.push(toSqliteValue(table, f.column, f.value));
      }
    } else if (f.type === "neq" && f.column && validCols.has(f.column)) {
      if (f.value === null) {
        clauses.push(`${f.column} IS NOT NULL`);
      } else {
        clauses.push(`${f.column} != ?`);
        params.push(toSqliteValue(table, f.column, f.value));
      }
    } else if (f.type === "in" && f.column && validCols.has(f.column) && Array.isArray(f.value)) {
      if (f.value.length === 0) {
        clauses.push("1 = 0");
      } else {
        const placeholders = f.value.map(() => "?").join(", ");
        clauses.push(`${f.column} IN (${placeholders})`);
        for (const item of f.value) {
          params.push(toSqliteValue(table, f.column, item));
        }
      }
    } else if (f.type === "or" && typeof f.value === "string") {
      // Parse PostgREST .or("slug.eq.foo,name_bn.eq.foo,name_en.eq.foo")
      const parts = f.value.split(",");
      const orSubClauses: string[] = [];
      for (const part of parts) {
        const eqIdx = part.indexOf(".eq.");
        if (eqIdx > 0) {
          const col = part.slice(0, eqIdx).trim();
          const val = part.slice(eqIdx + 4);
          if (validCols.has(col)) {
            orSubClauses.push(`${col} = ?`);
            params.push(toSqliteValue(table, col, val));
          }
        }
      }
      if (orSubClauses.length > 0) {
        clauses.push(`(${orSubClauses.join(" OR ")})`);
      }
    }
  }

  return {
    clause: clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

async function fetchTableRows(
  db: D1Database | null,
  table: string,
  filters: D1Filter[] = [],
  orders: D1Order[] = [],
  limit?: number | null,
): Promise<Record<string, unknown>[]> {
  if (db) {
    const { clause, params } = buildWhereClause(table, filters);
    const validCols = new Set(TABLE_COLUMNS[table] || []);
    const orderParts = orders
      .filter((o) => validCols.has(o.column))
      .map((o) => `${o.column} ${o.ascending === false ? "DESC" : "ASC"}`);
    const orderSql = orderParts.length > 0 ? ` ORDER BY ${orderParts.join(", ")}` : "";
    const limitSql = typeof limit === "number" && limit > 0 ? ` LIMIT ${Math.floor(limit)}` : "";
    const sql = `SELECT * FROM ${table}${clause}${orderSql}${limitSql}`;
    const res = await db
      .prepare(sql)
      .bind(...params)
      .all<Record<string, unknown>>();
    return (res.results || []).map((r) => normalizeRowFromSqlite(table, r));
  }

  // In-memory fallback
  let rows = [...(memoryStore[table] || [])].map((r) => normalizeRowFromSqlite(table, r));
  for (const f of filters) {
    if (f.type === "eq" && f.column) {
      rows = rows.filter((r) => r[f.column!] === f.value);
    } else if (f.type === "neq" && f.column) {
      rows = rows.filter((r) => r[f.column!] !== f.value);
    } else if (f.type === "in" && f.column && Array.isArray(f.value)) {
      const set = new Set(f.value);
      rows = rows.filter((r) => set.has(r[f.column!]));
    } else if (f.type === "or" && typeof f.value === "string") {
      const parts = f.value.split(",");
      const checks: Array<{ col: string; val: string }> = [];
      for (const part of parts) {
        const eqIdx = part.indexOf(".eq.");
        if (eqIdx > 0) {
          checks.push({ col: part.slice(0, eqIdx).trim(), val: part.slice(eqIdx + 4) });
        }
      }
      if (checks.length > 0) {
        rows = rows.filter((r) => checks.some((c) => String(r[c.col] ?? "") === c.val));
      }
    }
  }
  if (orders.length > 0) {
    rows.sort((a, b) => {
      for (const o of orders) {
        const av = a[o.column];
        const bv = b[o.column];
        if (av === bv) continue;
        if (av === null || av === undefined) return 1;
        if (bv === null || bv === undefined) return -1;
        const cmp = av < bv ? -1 : 1;
        return o.ascending === false ? -cmp : cmp;
      }
      return 0;
    });
  }
  if (typeof limit === "number" && limit > 0) {
    rows = rows.slice(0, limit);
  }
  return rows;
}

async function hydrateRelations(
  db: D1Database | null,
  table: string,
  selectStr: string,
  rows: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  if (rows.length === 0) return rows;

  if (table === "articles" && selectStr.includes("article_categories")) {
    const [allAcs, allCats] = await Promise.all([
      fetchTableRows(db, "article_categories"),
      fetchTableRows(db, "categories"),
    ]);
    const catById = new Map(allCats.map((c) => [String(c.id), c]));
    const acsByArticle = new Map<string, Record<string, unknown>[]>();
    for (const ac of allAcs) {
      const aid = String(ac.article_id);
      if (!acsByArticle.has(aid)) acsByArticle.set(aid, []);
      acsByArticle.get(aid)!.push({
        category_id: ac.category_id,
        categories: catById.get(String(ac.category_id)) ?? null,
      });
    }
    return rows.map((r) => ({
      ...r,
      article_categories: acsByArticle.get(String(r.id)) || [],
    }));
  }

  if (table === "article_categories") {
    if (selectStr.includes("articles")) {
      const [allArts, allAcs, allCats] = await Promise.all([
        fetchTableRows(db, "articles"),
        fetchTableRows(db, "article_categories"),
        fetchTableRows(db, "categories"),
      ]);
      const catById = new Map(allCats.map((c) => [String(c.id), c]));
      const acsByArticle = new Map<string, Record<string, unknown>[]>();
      for (const ac of allAcs) {
        const aid = String(ac.article_id);
        if (!acsByArticle.has(aid)) acsByArticle.set(aid, []);
        acsByArticle.get(aid)!.push({
          category_id: ac.category_id,
          categories: catById.get(String(ac.category_id)) ?? null,
        });
      }
      const artById = new Map(
        allArts.map((a) => [
          String(a.id),
          {
            ...a,
            article_categories: acsByArticle.get(String(a.id)) || [],
          },
        ]),
      );
      return rows.map((r) => ({
        ...r,
        articles: artById.get(String(r.article_id)) ?? null,
      }));
    }

    if (selectStr.includes("categories")) {
      const allCats = await fetchTableRows(db, "categories");
      const catById = new Map(allCats.map((c) => [String(c.id), c]));
      return rows.map((r) => ({
        ...r,
        categories: catById.get(String(r.category_id)) ?? null,
      }));
    }
  }

  if (table === "bookmarks" && selectStr.includes("articles")) {
    const allArts = await fetchTableRows(db, "articles");
    const artById = new Map(allArts.map((a) => [String(a.id), a]));
    return rows.map((r) => ({
      ...r,
      articles: r.article_id ? (artById.get(String(r.article_id)) ?? null) : null,
    }));
  }

  return rows;
}

export async function executeD1Query(
  descriptor: D1QueryDescriptor,
  dbOverride?: D1Database | null,
): Promise<{ data: unknown; error: { message: string } | null }> {
  const db = dbOverride !== undefined ? dbOverride : activeD1Database;
  if (db) {
    await ensureD1Initialized(db);
  }

  const { table, operation } = descriptor;
  const validCols = TABLE_COLUMNS[table];
  if (!validCols) {
    return { data: null, error: { message: `Unknown table: ${table}` } };
  }

  try {
    if (operation === "select") {
      let rows = await fetchTableRows(
        db,
        table,
        descriptor.filters || [],
        descriptor.orders || [],
        descriptor.limit,
      );
      rows = await hydrateRelations(db, table, descriptor.select || "*", rows);

      if (descriptor.single === "single") {
        if (rows.length === 0) {
          return { data: null, error: { message: "Row not found" } };
        }
        return { data: rows[0], error: null };
      }
      if (descriptor.single === "maybeSingle") {
        return { data: rows[0] ?? null, error: null };
      }
      return { data: rows, error: null };
    }

    if (operation === "insert" || operation === "upsert") {
      const rawItems = Array.isArray(descriptor.values)
        ? descriptor.values
        : descriptor.values
          ? [descriptor.values]
          : [];
      if (rawItems.length === 0) {
        return { data: [], error: null };
      }

      const now = new Date().toISOString();
      const insertedRows: Record<string, unknown>[] = [];
      const stmts: D1PreparedStatement[] = [];

      for (const item of rawItems) {
        const record = { ...(item as Record<string, unknown>) };
        if (validCols.includes("id") && !record.id) {
          record.id = crypto.randomUUID();
        }
        if (validCols.includes("created_at") && !record.created_at) {
          record.created_at = now;
        }
        if (TABLES_WITH_UPDATED_AT.has(table) && !record.updated_at) {
          record.updated_at = now;
        }

        // If upserting by id, merge with existing record first so omitted fields aren't wiped
        if (operation === "upsert" && record.id) {
          const existing = await fetchTableRows(db, table, [
            { type: "eq", column: "id", value: record.id },
          ]);
          if (existing.length > 0) {
            Object.assign(record, { ...existing[0], ...record, updated_at: now });
          }
        }

        const colsToWrite = validCols.filter((c) => c in record);
        const placeholders = colsToWrite.map(() => "?").join(", ");
        const bindVals = colsToWrite.map((c) => toSqliteValue(table, c, record[c]));
        const verb = operation === "upsert" ? "INSERT OR REPLACE" : "INSERT OR IGNORE";

        if (db) {
          stmts.push(
            db
              .prepare(`${verb} INTO ${table} (${colsToWrite.join(", ")}) VALUES (${placeholders})`)
              .bind(...bindVals),
          );
        } else {
          const list = memoryStore[table] || (memoryStore[table] = []);
          if (table === "article_categories") {
            const idx = list.findIndex(
              (r) => r.article_id === record.article_id && r.category_id === record.category_id,
            );
            if (idx >= 0) list[idx] = record;
            else list.push(record);
          } else if (record.id) {
            const idx = list.findIndex((r) => r.id === record.id);
            if (idx >= 0) list[idx] = { ...list[idx], ...record };
            else list.push(record);
          } else {
            list.push(record);
          }
        }
        insertedRows.push(normalizeRowFromSqlite(table, record));
      }

      if (db && stmts.length > 0) {
        await db.batch(stmts);
      }

      if (descriptor.single === "single" || descriptor.single === "maybeSingle") {
        return { data: insertedRows[0] ?? null, error: null };
      }
      return { data: insertedRows, error: null };
    }

    if (operation === "update") {
      const updates = (descriptor.values || {}) as Record<string, unknown>;
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = { ...updates };
      if (TABLES_WITH_UPDATED_AT.has(table)) {
        payload.updated_at = now;
      }

      const colsToUpdate = validCols.filter((c) => c in payload && c !== "id");
      if (colsToUpdate.length === 0) {
        return { data: null, error: null };
      }

      if (db) {
        const setSql = colsToUpdate.map((c) => `${c} = ?`).join(", ");
        const setParams = colsToUpdate.map((c) => toSqliteValue(table, c, payload[c]));
        const { clause, params: whereParams } = buildWhereClause(table, descriptor.filters || []);
        await db
          .prepare(`UPDATE ${table} SET ${setSql}${clause}`)
          .bind(...setParams, ...whereParams)
          .run();
      } else {
        const matching = await fetchTableRows(null, table, descriptor.filters || []);
        const matchIds = new Set(matching.map((m) => m.id));
        const list = memoryStore[table] || [];
        for (let i = 0; i < list.length; i++) {
          if (matchIds.has(list[i].id)) {
            list[i] = { ...list[i], ...payload };
          }
        }
      }
      return { data: null, error: null };
    }

    if (operation === "delete") {
      if (db) {
        const { clause, params } = buildWhereClause(table, descriptor.filters || []);
        if (clause) {
          await db
            .prepare(`DELETE FROM ${table}${clause}`)
            .bind(...params)
            .run();
        }
      } else {
        const matching = await fetchTableRows(null, table, descriptor.filters || []);
        const list = memoryStore[table] || [];
        memoryStore[table] = list.filter(
          (row) =>
            !matching.some((m) =>
              table === "article_categories"
                ? m.article_id === row.article_id && m.category_id === row.category_id
                : m.id === row.id,
            ),
        );
      }
      return { data: null, error: null };
    }

    return { data: null, error: { message: `Unsupported operation: ${operation}` } };
  } catch (err) {
    console.error(`[D1] Query error on ${table} (${operation}):`, err);
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
}

// --- WebCrypto Password Hashing & JWT Helpers ---
const JWT_SECRET = "alam-m-d1-cloudflare-jwt-secret-key-2026";

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(`alam-m-salt:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return bytesToBase64Url(new Uint8Array(digest));
}

async function signJwt(payload: Record<string, unknown>): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();
  const headerB64 = bytesToBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = bytesToBase64Url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

export async function verifyJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(sigB64),
      enc.encode(signingInput),
    );
    if (!valid) return null;
    const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    return JSON.parse(payloadJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function buildSessionForUser(user: {
  id: string;
  email: string;
  display_name?: string | null;
  created_at?: string;
}) {
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + 60 * 60 * 24 * 30; // 30 days
  const userObj = {
    id: user.id,
    aud: "authenticated",
    role: "authenticated",
    email: user.email,
    email_confirmed_at: user.created_at || new Date().toISOString(),
    user_metadata: { display_name: user.display_name || user.email.split("@")[0] },
    app_metadata: { provider: "email", providers: ["email"] },
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const accessToken = await signJwt({
    sub: user.id,
    email: user.email,
    role: "authenticated",
    iat: nowSec,
    exp: expSec,
  });
  return {
    access_token: accessToken,
    refresh_token: accessToken,
    expires_in: 60 * 60 * 24 * 30,
    expires_at: expSec,
    token_type: "bearer",
    user: userObj,
  };
}

export async function executeD1Auth(
  action: "signIn" | "signUp" | "updateUser" | "resetPassword" | "session",
  payload: { email?: string; password?: string; token?: string },
  dbOverride?: D1Database | null,
): Promise<{ data: Record<string, unknown>; error: { message: string } | null }> {
  const db = dbOverride !== undefined ? dbOverride : activeD1Database;
  if (db) {
    await ensureD1Initialized(db);
  }

  try {
    if (action === "resetPassword") {
      return { data: {}, error: null };
    }

    if (action === "session") {
      if (!payload.token) return { data: { session: null, user: null }, error: null };
      const claims = await verifyJwt(payload.token);
      if (!claims || typeof claims.sub !== "string") {
        return { data: { session: null, user: null }, error: null };
      }
      const users = await fetchTableRows(db, "users", [
        { type: "eq", column: "id", value: claims.sub },
      ]);
      const u = users[0] ?? {
        id: claims.sub,
        email: String(claims.email || ""),
        display_name: String(claims.email || "").split("@")[0],
      };
      const session = await buildSessionForUser({
        id: String(u.id),
        email: String(u.email),
        display_name: u.display_name ? String(u.display_name) : null,
        created_at: u.created_at ? String(u.created_at) : undefined,
      });
      return { data: { session, user: session.user, claims }, error: null };
    }

    if (action === "updateUser") {
      if (!payload.token || !payload.password) {
        return { data: {}, error: { message: "Unauthorized or missing password" } };
      }
      const claims = await verifyJwt(payload.token);
      if (!claims || typeof claims.sub !== "string") {
        return { data: {}, error: { message: "Invalid session" } };
      }
      const passwordHash = await hashPassword(payload.password);
      await executeD1Query(
        {
          table: "users",
          operation: "update",
          values: { password_hash: passwordHash },
          filters: [{ type: "eq", column: "id", value: claims.sub }],
        },
        db,
      );
      return { data: { user: { id: claims.sub, email: claims.email } }, error: null };
    }

    const email = (payload.email || "").trim().toLowerCase();
    const password = payload.password || "";
    if (!email || !password) {
      return { data: {}, error: { message: "Email and password are required" } };
    }

    const passwordHash = await hashPassword(password);
    const existingUsers = await fetchTableRows(db, "users", [
      { type: "eq", column: "email", value: email },
    ]);
    const isOwnerAdmin = ADMIN_EMAILS.has(email);

    if (action === "signUp") {
      if (existingUsers.length > 0) {
        return { data: {}, error: { message: "Account already exists. Please sign in." } };
      }
      const userId = crypto.randomUUID();
      const displayName = email.split("@")[0];
      const now = new Date().toISOString();

      await executeD1Query(
        {
          table: "users",
          operation: "insert",
          values: {
            id: userId,
            email,
            password_hash: passwordHash,
            display_name: displayName,
            created_at: now,
            updated_at: now,
          },
        },
        db,
      );
      await executeD1Query(
        {
          table: "profiles",
          operation: "insert",
          values: { id: userId, email, display_name: displayName, created_at: now },
        },
        db,
      );
      await executeD1Query(
        {
          table: "user_roles",
          operation: "insert",
          values: {
            id: crypto.randomUUID(),
            user_id: userId,
            role: isOwnerAdmin ? "admin" : "user",
            created_at: now,
          },
        },
        db,
      );

      const session = await buildSessionForUser({
        id: userId,
        email,
        display_name: displayName,
        created_at: now,
      });
      return { data: { session, user: session.user }, error: null };
    }

    if (action === "signIn") {
      let userRecord = existingUsers[0];

      // Auto-bootstrap owner admin account on first sign-in if not yet created in D1
      if (!userRecord && isOwnerAdmin) {
        const userId = crypto.randomUUID();
        const displayName = email.split("@")[0];
        const now = new Date().toISOString();
        await executeD1Query(
          {
            table: "users",
            operation: "insert",
            values: {
              id: userId,
              email,
              password_hash: passwordHash,
              display_name: displayName,
              created_at: now,
              updated_at: now,
            },
          },
          db,
        );
        await executeD1Query(
          {
            table: "profiles",
            operation: "insert",
            values: { id: userId, email, display_name: displayName, created_at: now },
          },
          db,
        );
        await executeD1Query(
          {
            table: "user_roles",
            operation: "insert",
            values: {
              id: crypto.randomUUID(),
              user_id: userId,
              role: "admin",
              created_at: now,
            },
          },
          db,
        );
        userRecord = {
          id: userId,
          email,
          password_hash: passwordHash,
          display_name: displayName,
          created_at: now,
        };
      }

      if (!userRecord) {
        return { data: {}, error: { message: "Invalid login credentials" } };
      }

      if (userRecord.password_hash !== passwordHash) {
        return { data: {}, error: { message: "Invalid login credentials" } };
      }

      // Ensure owner admin always has admin role in user_roles
      if (isOwnerAdmin) {
        const existingRoles = await fetchTableRows(db, "user_roles", [
          { type: "eq", column: "user_id", value: userRecord.id },
          { type: "eq", column: "role", value: "admin" },
        ]);
        if (existingRoles.length === 0) {
          await executeD1Query(
            {
              table: "user_roles",
              operation: "insert",
              values: {
                id: crypto.randomUUID(),
                user_id: String(userRecord.id),
                role: "admin",
                created_at: new Date().toISOString(),
              },
            },
            db,
          );
        }
      }

      const session = await buildSessionForUser({
        id: String(userRecord.id),
        email: String(userRecord.email),
        display_name: userRecord.display_name ? String(userRecord.display_name) : null,
        created_at: userRecord.created_at ? String(userRecord.created_at) : undefined,
      });
      return { data: { session, user: session.user }, error: null };
    }

    return { data: {}, error: { message: `Unknown auth action: ${action}` } };
  } catch (err) {
    console.error(`[D1 Auth] Error in ${action}:`, err);
    return {
      data: {},
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
}
