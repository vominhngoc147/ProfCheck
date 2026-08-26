#!/usr/bin/env node
// Applies SQL migrations in supabase/migrations/ that have not been applied yet.
// Tracks applied files in _migrations table. Statement-by-statement execution
// (Supabase pooler has issues with multi-statement implicit transactions).
//
// Env: SUPABASE_DB_POOLER (required), MIGRATIONS_DIR (optional).
// First run on an already-migrated DB bootstraps: marks existing files applied.

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const CONN = process.env.SUPABASE_DB_POOLER;
const DIR = process.env.MIGRATIONS_DIR ?? "supabase/migrations";

if (!CONN) {
  console.error("Missing SUPABASE_DB_POOLER env var");
  process.exit(1);
}

function splitStatements(sql) {
  const stmts = [];
  let cur = "";
  let inDollar = false;
  let dollarTag = "";
  let inLineComment = false;
  let inBlockComment = false;
  let inSingle = false;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    const two = sql.slice(i, i + 2);

    if (inLineComment) {
      cur += c;
      if (c === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      cur += c;
      if (two === "*/") { cur += sql[i + 1]; i++; inBlockComment = false; }
      continue;
    }
    if (inSingle) {
      cur += c;
      if (c === "'") inSingle = false;
      continue;
    }
    if (!inDollar && two === "--") { inLineComment = true; cur += two; i++; continue; }
    if (!inDollar && two === "/*") { inBlockComment = true; cur += two; i++; continue; }
    if (c === "'") { inSingle = true; cur += c; continue; }

    if (!inDollar && c === "$") {
      const m = /^(\$[A-Za-z0-9_]*\$)/.exec(sql.slice(i));
      if (m) {
        inDollar = true;
        dollarTag = m[1];
        cur += m[1];
        i += m[1].length - 1;
        continue;
      }
    } else if (inDollar && sql.startsWith(dollarTag, i)) {
      inDollar = false;
      cur += dollarTag;
      i += dollarTag.length - 1;
      continue;
    }

    if (!inDollar && c === ";") {
      stmts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) stmts.push(cur.trim());
  return stmts.filter(
    (s) => s.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, "").trim().length > 0
  );
}

const client = new pg.Client({
  connectionString: CONN,
  ssl: { rejectUnauthorized: false },
});

async function tableExists(name) {
  const { rows } = await client.query(
    `select 1 from information_schema.tables where table_schema='public' and table_name=$1`,
    [name]
  );
  return rows.length > 0;
}

try {
  await client.connect();
  const files = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const bootstrapping = !(await tableExists("_migrations"));
  if (bootstrapping) {
    await client.query(
      `create table public._migrations (
         filename text primary key,
         applied_at timestamptz not null default now()
       )`
    );
    console.log(`Created _migrations. Bootstrapping: marking ${files.length} existing migrations as applied.`);
    for (const f of files) {
      await client.query(`insert into public._migrations (filename) values ($1)`, [f]);
    }
    console.log("Bootstrap complete.");
  } else {
    const { rows } = await client.query(`select filename from public._migrations`);
    const applied = new Set(rows.map((r) => r.filename));
    let ran = 0;

    for (const f of files) {
      if (applied.has(f)) continue;
      const sql = fs.readFileSync(path.join(DIR, f), "utf8");
      const stmts = splitStatements(sql);
      console.log(`Applying ${f} (${stmts.length} statements)...`);
      for (let idx = 0; idx < stmts.length; idx++) {
        try {
          await client.query(stmts[idx]);
        } catch (e) {
          console.error(`FAILED ${f} statement #${idx + 1}: ${e.message}`);
          console.error(stmts[idx].split("\n").slice(0, 10).join("\n"));
          process.exit(1);
        }
      }
      await client.query(`insert into public._migrations (filename) values ($1)`, [f]);
      ran++;
    }
    console.log(ran === 0 ? "No pending migrations." : `Applied ${ran} migration(s).`);
  }
  await client.end();
} catch (e) {
  console.error("Migration runner error:", e.message);
  process.exit(1);
}
