import { Tag } from "@trading-logger/shared";
import { sqlite } from "../db/client.js";
import dayjs from "dayjs";

export function listTags(): Tag[] {
  return sqlite
    .prepare(`SELECT * FROM tags ORDER BY name ASC`)
    .all()
    .map((t: any) => ({
      id: t.id,
      name: t.name,
      color: t.color ?? undefined,
      createdAt: t.created_at ? dayjs(t.created_at).toISOString() : undefined
    }));
}

export function createTag(tag: Pick<Tag, "name" | "color">): Tag {
  const now = dayjs().toISOString();
  const info = sqlite
    .prepare(`INSERT INTO tags (name, color, created_at) VALUES (?, ?, ?)`)
    .run(tag.name, tag.color ?? null, now);
  const id = Number(info.lastInsertRowid);
  return {
    id,
    name: tag.name,
    color: tag.color ?? undefined,
    createdAt: now
  };
}

export function updateTag(id: number, tag: Partial<Tag>): Tag {
  const current = sqlite
    .prepare(`SELECT * FROM tags WHERE id = ?`)
    .get(id) as any;
  if (!current) {
    throw new Error("Tag not found");
  }
  const updated = {
    name: tag.name ?? current.name,
    color: tag.color ?? current.color
  };
  sqlite
    .prepare(`UPDATE tags SET name = ?, color = ? WHERE id = ?`)
    .run(updated.name, updated.color ?? null, id);
  return {
    id,
    name: updated.name,
    color: updated.color ?? undefined
  };
}

export function deleteTag(id: number) {
  sqlite.prepare(`DELETE FROM tags WHERE id = ?`).run(id);
}
