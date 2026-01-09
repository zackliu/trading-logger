import {
  CustomField,
  CustomFieldOption
} from "@trading-logger/shared";
import dayjs from "dayjs";
import { sqlite } from "../db/client.js";

type FieldInput = {
  key: string;
  label: string;
  type: CustomField["type"];
  isRequired?: boolean;
  options?: CustomFieldOption[];
};

export function listCustomFields(): CustomField[] {
  const fields = sqlite
    .prepare(`SELECT * FROM custom_fields ORDER BY created_at ASC`)
    .all() as any[];

  const fieldIds = fields.map((f) => f.id);
  const options = fieldIds.length
    ? (sqlite
        .prepare(
          `SELECT * FROM custom_field_options WHERE field_id IN (${new Array(
            fieldIds.length
          )
            .fill("?")
            .join(", ")}) ORDER BY sort_order ASC`
        )
        .all(...fieldIds) as any[])
    : [];

  const optionMap = new Map<number, CustomFieldOption[]>();
  for (const opt of options) {
    const arr = optionMap.get(opt.field_id) ?? [];
    optionMap.set(opt.field_id, arr);
    arr.push({
      id: opt.id,
      fieldId: opt.field_id,
      value: opt.value,
      label: opt.label,
      sortOrder: opt.sort_order ?? undefined
    });
  }

  return fields.map((f) => ({
    id: f.id,
    key: f.key,
    label: f.label,
    type: f.type,
    isRequired: !!f.is_required,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
    options: optionMap.get(f.id)
  }));
}

export function createCustomField(input: FieldInput): CustomField {
  const now = dayjs().toISOString();
  const info = sqlite
    .prepare(
      `INSERT INTO custom_fields (key, label, type, is_required, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.key,
      input.label,
      input.type,
      input.isRequired ? 1 : 0,
      now,
      now
    );
  const fieldId = Number(info.lastInsertRowid);
  if (input.options?.length) {
    const stmt = sqlite.prepare(
      `INSERT INTO custom_field_options (field_id, value, label, sort_order) VALUES (?, ?, ?, ?)`
    );
    input.options.forEach((opt, index) => {
      stmt.run(fieldId, opt.value, opt.label, opt.sortOrder ?? index);
    });
  }
  return {
    id: fieldId,
    key: input.key,
    label: input.label,
    type: input.type,
    isRequired: !!input.isRequired,
    options: input.options
  };
}

export function updateCustomField(id: number, input: Partial<FieldInput>) {
  const current = sqlite
    .prepare(`SELECT * FROM custom_fields WHERE id = ?`)
    .get(id) as any;
  if (!current) {
    throw new Error("Custom field not found");
  }
  const now = dayjs().toISOString();
  sqlite
    .prepare(
      `UPDATE custom_fields SET key = ?, label = ?, type = ?, is_required = ?, updated_at = ? WHERE id = ?`
    )
    .run(
      input.key ?? current.key,
      input.label ?? current.label,
      input.type ?? current.type,
      input.isRequired !== undefined ? (input.isRequired ? 1 : 0) : current.is_required,
      now,
      id
    );

  if (input.options) {
    sqlite.prepare(`DELETE FROM custom_field_options WHERE field_id = ?`).run(id);
    const stmt = sqlite.prepare(
      `INSERT INTO custom_field_options (field_id, value, label, sort_order) VALUES (?, ?, ?, ?)`
    );
    input.options.forEach((opt, index) => {
      stmt.run(id, opt.value, opt.label, opt.sortOrder ?? index);
    });
  }
}

export function deleteCustomField(id: number) {
  sqlite.prepare(`DELETE FROM custom_fields WHERE id = ?`).run(id);
}
