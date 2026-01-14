import { Setup } from "@trading-logger/shared";
import dayjs from "dayjs";
import { sqlite } from "../db/client.js";

const UNKNOWN_NAME = "Unknown";

const mapSetup = (row: any): Setup => ({
  id: row.id,
  name: row.name,
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at ? dayjs(row.created_at).toISOString() : undefined
});

export function ensureUnknownSetup(): number {
  const existing = sqlite
    .prepare(`SELECT id FROM setups WHERE name = ? LIMIT 1`)
    .get(UNKNOWN_NAME) as any;
  if (existing?.id) return existing.id;
  const now = dayjs().toISOString();
  const info = sqlite
    .prepare(
      `INSERT INTO setups (name, sort_order, created_at) VALUES (?, ?, ?)`
    )
    .run(UNKNOWN_NAME, 0, now);
  return Number(info.lastInsertRowid);
}

function nextSortOrder(): number {
  const row = sqlite
    .prepare(`SELECT MAX(sort_order) as maxOrder FROM setups`)
    .get() as any;
  return (row?.maxOrder ?? 0) + 1;
}

export function listSetups(): Setup[] {
  ensureUnknownSetup();
  return sqlite
    .prepare(
      `SELECT * FROM setups ORDER BY sort_order ASC, created_at ASC, id ASC`
    )
    .all()
    .map(mapSetup);
}

export function createSetup(input: Pick<Setup, "name" | "sortOrder">): Setup {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Name is required");
  }
  ensureUnknownSetup();
  const dup = sqlite
    .prepare(`SELECT id FROM setups WHERE lower(name) = lower(?) LIMIT 1`)
    .get(name) as any;
  if (dup) {
    throw new Error("Setup name already exists");
  }
  const now = dayjs().toISOString();
  const sortOrder = input.sortOrder ?? nextSortOrder();
  const info = sqlite
    .prepare(
      `INSERT INTO setups (name, sort_order, created_at) VALUES (?, ?, ?)`
    )
    .run(name, sortOrder, now);
  return {
    id: Number(info.lastInsertRowid),
    name,
    sortOrder,
    createdAt: now
  };
}

export function updateSetup(
  id: number,
  input: Partial<Pick<Setup, "name" | "sortOrder">>
): Setup {
  const unknownId = ensureUnknownSetup();
  if (id === unknownId) {
    throw new Error("Default Unknown setup cannot be modified");
  }
  const current = sqlite
    .prepare(`SELECT * FROM setups WHERE id = ?`)
    .get(id) as any;
  if (!current) {
    throw new Error("Setup not found");
  }
  const name = input.name?.trim() ?? current.name;
  if (!name) {
    throw new Error("Name is required");
  }
  const dup = sqlite
    .prepare(
      `SELECT id FROM setups WHERE lower(name) = lower(?) AND id != ? LIMIT 1`
    )
    .get(name, id) as any;
  if (dup) {
    throw new Error("Setup name already exists");
  }
  const sortOrder =
    input.sortOrder !== undefined ? input.sortOrder : current.sort_order ?? 0;
  sqlite
    .prepare(`UPDATE setups SET name = ?, sort_order = ? WHERE id = ?`)
    .run(name, sortOrder, id);
  return {
    id,
    name,
    sortOrder,
    createdAt: current.created_at ?? undefined
  };
}

export function deleteSetup(id: number) {
  const unknownId = ensureUnknownSetup();
  if (id === unknownId) {
    throw new Error("Default Unknown setup cannot be deleted");
  }
  sqlite.prepare(`UPDATE records SET setup_id = ? WHERE setup_id = ?`).run(
    unknownId,
    id
  );
  sqlite.prepare(`DELETE FROM setups WHERE id = ?`).run(id);
}

export function getSetupById(id: number): Setup | null {
  const row = sqlite
    .prepare(`SELECT * FROM setups WHERE id = ? LIMIT 1`)
    .get(id) as any;
  return row ? mapSetup(row) : null;
}

export function normalizeSetupId(preferred?: number | null): number {
  const unknownId = ensureUnknownSetup();
  if (!preferred) return unknownId;
  const exists = sqlite
    .prepare(`SELECT id FROM setups WHERE id = ? LIMIT 1`)
    .get(preferred) as any;
  if (exists?.id) return preferred;
  return unknownId;
}
