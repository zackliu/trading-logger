import {
  ComplianceSelection,
  CustomFieldValue,
  RecordFilters,
  RecordInput,
  RecordUpdate,
  RecordWithRelations
} from "@trading-logger/shared";
import dayjs from "dayjs";
import { sqlite, uploadsDir } from "../db/client.js";
import { buildRecordWhereClause, normalizeFilters } from "./filters.js";
import fs from "fs";
import path from "path";
import { listComplianceChecks } from "./compliance.js";

type RecordRow = {
  id: number;
  datetime: string;
  symbol: string;
  account_type: string;
  result: string;
  r_multiple: number | null;
  entry_emotion: string | null;
  exit_emotion: string | null;
  complied: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

type TagRow = { id: number; name: string; color: string | null; created_at: string };
type AttachmentRow = {
  id: number;
  record_id: number | null;
  file_path: string;
  mime: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
};

type CustomValueRow = {
  id: number;
  record_id: number;
  field_id: number;
  value_text: string | null;
  value_number: number | null;
  value_bool: number | null;
  value_date: string | null;
  value_datetime: string | null;
  type: string;
};

const placeholders = (count: number) => new Array(count).fill("?").join(", ");

function mapRecords(rows: RecordRow[]): RecordWithRelations[] {
  return rows.map((row) => ({
    id: row.id,
    datetime: row.datetime,
    symbol: row.symbol,
    accountType: row.account_type as any,
    result: row.result as any,
    rMultiple: row.r_multiple,
    entryEmotion: row.entry_emotion ?? undefined,
    exitEmotion: row.exit_emotion ?? undefined,
    complied: !!row.complied,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: [],
    attachments: [],
    customValues: [],
    complianceSelections: []
  }));
}

function attachRelations(
  records: RecordWithRelations[],
  tagRows: (TagRow & { record_id: number })[],
  attachmentRows: AttachmentRow[],
  customValueRows: CustomValueRow[]
): RecordWithRelations[] {
  const byId = new Map<number, RecordWithRelations>();
  records.forEach((r) => byId.set(r.id!, r));

  for (const tag of tagRows) {
    const rec = byId.get(tag.record_id);
    if (rec) {
      rec.tags.push({
        id: tag.id,
        name: tag.name,
        color: tag.color ?? undefined,
        createdAt: tag.created_at
          ? dayjs(tag.created_at).toISOString()
          : undefined
      });
    }
  }

  for (const att of attachmentRows) {
    if (att.record_id === null) continue;
    const rec = byId.get(att.record_id);
    if (rec) {
      rec.attachments.push({
        id: att.id,
        recordId: att.record_id,
        filePath: att.file_path,
        mime: att.mime,
        width: att.width ?? undefined,
        height: att.height ?? undefined,
        sizeBytes: att.size_bytes ?? undefined,
        createdAt: att.created_at
      });
    }
  }

  const customMap = new Map<
    number,
    Map<
      number,
      CustomFieldValue & {
        type: string;
      }
    >
  >();

  for (const row of customValueRows) {
    const recordId = row.record_id;
    const currentRecord = customMap.get(recordId) ?? new Map();
    customMap.set(recordId, currentRecord);

    if (row.type === "multiSelect") {
      const existing = currentRecord.get(row.field_id);
      if (existing && existing.type === "multiSelect") {
        existing.values.push(row.value_text ?? "");
      } else {
        currentRecord.set(row.field_id, {
          id: row.id,
          fieldId: row.field_id,
          type: "multiSelect",
          values: row.value_text ? [row.value_text] : []
        });
      }
    } else {
      const common = {
        id: row.id,
        fieldId: row.field_id
      };
      switch (row.type) {
        case "text":
        case "singleSelect":
          currentRecord.set(row.field_id, {
            ...common,
            type: row.type as "text" | "singleSelect",
            value: row.value_text ?? ""
          });
          break;
        case "number":
          currentRecord.set(row.field_id, {
            ...common,
            type: "number",
            value: row.value_number ?? 0
          });
          break;
        case "boolean":
          currentRecord.set(row.field_id, {
            ...common,
            type: "boolean",
            value: !!row.value_bool
          });
          break;
        case "date":
          currentRecord.set(row.field_id, {
            ...common,
            type: "date",
            value: row.value_date ?? ""
          });
          break;
        case "datetime":
          currentRecord.set(row.field_id, {
            ...common,
            type: "datetime",
            value: row.value_datetime ?? ""
          });
          break;
        default:
          break;
      }
    }
  }

  for (const [recordId, values] of customMap.entries()) {
    const rec = byId.get(recordId);
    if (rec) {
      rec.customValues = Array.from(values.values());
    }
  }

  return records;
}

function mapComplianceSelections(recordId: number): ComplianceSelection[] {
  const rows = sqlite
    .prepare(
      `SELECT * FROM record_compliance WHERE record_id = ? ORDER BY id ASC`
    )
    .all(recordId) as any[];
  return rows.map((row) => {
    if (row.option_id !== null && row.option_id !== undefined) {
      return {
        type: "setup",
        checkId: row.check_id,
        optionId: row.option_id
      } as ComplianceSelection;
    }
    return {
      type: "checkbox",
      checkId: row.check_id,
      checked: !!row.is_checked
    } as ComplianceSelection;
  });
}

function setComplianceSelections(recordId: number, selections: ComplianceSelection[]) {
  sqlite.prepare(`DELETE FROM record_compliance WHERE record_id = ?`).run(recordId);
  if (!selections.length) return;
  const stmt = sqlite.prepare(
    `INSERT INTO record_compliance (record_id, check_id, is_checked, option_id) VALUES (?, ?, ?, ?)`
  );
  selections.forEach((sel) => {
    if (sel.type === "checkbox") {
      stmt.run(recordId, sel.checkId, sel.checked ? 1 : 0, null);
    } else {
      stmt.run(recordId, sel.checkId, null, sel.optionId ?? null);
    }
  });
}

function computeComplied(
  selections: ComplianceSelection[],
  fallback: boolean
): boolean {
  const checks = listComplianceChecks();
  if (!checks.length) return fallback;
  for (const c of checks) {
    const sel = selections.find((s) => s.checkId === c.id);
    if (c.type === "checkbox") {
      if (!sel || sel.type !== "checkbox" || !sel.checked) return false;
    } else {
      if (!sel || sel.type !== "setup" || sel.optionId === null) return false;
    }
  }
  return true;
}

function setRecordTags(recordId: number, tagIds: number[]) {
  const trx = sqlite.transaction(() => {
    sqlite.prepare(`DELETE FROM record_tags WHERE record_id = ?`).run(recordId);
    if (tagIds.length) {
      const stmt = sqlite.prepare(
        `INSERT OR IGNORE INTO record_tags (record_id, tag_id) VALUES (?, ?)`
      );
      for (const tagId of tagIds) {
        stmt.run(recordId, tagId);
      }
    }
  });
  trx();
}

function setRecordAttachments(recordId: number, attachmentIds: number[]) {
  const trx = sqlite.transaction(() => {
    // Detach attachments that are currently linked to this record but not in the new list
    const existingIds = (sqlite
      .prepare(`SELECT id FROM attachments WHERE record_id = ?`)
      .all(recordId) as { id: number }[]).map((r) => r.id);
    const toDetach = existingIds.filter(
      (attachmentId: number) => !attachmentIds.includes(attachmentId)
    );
    if (toDetach.length) {
      sqlite
        .prepare(
          `UPDATE attachments SET record_id = NULL WHERE id IN (${placeholders(
            toDetach.length
          )})`
        )
        .run(...toDetach);
    }
    if (attachmentIds.length) {
      sqlite
        .prepare(
          `UPDATE attachments SET record_id = ? WHERE id IN (${placeholders(
            attachmentIds.length
          )})`
        )
        .run(recordId, ...attachmentIds);
    }
  });
  trx();
}

function setRecordCustomValues(recordId: number, values: CustomFieldValue[]) {
  const trx = sqlite.transaction(() => {
    sqlite
      .prepare(`DELETE FROM record_field_values WHERE record_id = ?`)
      .run(recordId);
    if (!values.length) return;

    const stmt = sqlite.prepare(
      `INSERT INTO record_field_values (record_id, field_id, value_text, value_number, value_bool, value_date, value_datetime, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const now = dayjs().toISOString();
    for (const val of values) {
      switch (val.type) {
        case "multiSelect":
          for (const option of val.values) {
            stmt.run(
              recordId,
              val.fieldId,
              option,
              null,
              null,
              null,
              null,
              now,
              now
            );
          }
          break;
        case "text":
        case "singleSelect":
          stmt.run(
            recordId,
            val.fieldId,
            val.value,
            null,
            null,
            null,
            null,
            now,
            now
          );
          break;
        case "number":
          stmt.run(
            recordId,
            val.fieldId,
            null,
            val.value,
            null,
            null,
            null,
            now,
            now
          );
          break;
        case "boolean":
          stmt.run(
            recordId,
            val.fieldId,
            null,
            null,
            val.value ? 1 : 0,
            null,
            null,
            now,
            now
          );
          break;
        case "date":
          stmt.run(
            recordId,
            val.fieldId,
            null,
            null,
            null,
            val.value,
            null,
            now,
            now
          );
          break;
        case "datetime":
          stmt.run(
            recordId,
            val.fieldId,
            null,
            null,
            null,
            null,
            val.value,
            now,
            now
          );
          break;
        default:
          break;
      }
    }
  });
  trx();
}

export function listRecords(
  rawFilters: Partial<RecordFilters>
): { items: RecordWithRelations[]; total: number } {
  const filters = normalizeFilters(rawFilters);
  const { where, params } = buildRecordWhereClause(filters);
  const limit = filters.pageSize ?? 20;
  const offset = ((filters.page ?? 1) - 1) * limit;

  const rows = sqlite
    .prepare(
      `SELECT * FROM records r WHERE ${where} ORDER BY r.datetime DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as RecordRow[];

  const totalRow = sqlite
    .prepare(`SELECT COUNT(*) as count FROM records r WHERE ${where}`)
    .get(...params) as { count: number };
  const total = totalRow?.count ?? 0;

  if (!rows.length) {
    return { items: [], total };
  }
  const recordIds = rows.map((r) => r.id);
  const tagRows = sqlite
    .prepare(
      `SELECT rt.record_id, t.* FROM record_tags rt JOIN tags t ON t.id = rt.tag_id WHERE rt.record_id IN (${placeholders(
        recordIds.length
      )})`
    )
    .all(...recordIds) as (TagRow & { record_id: number })[];
  const attachmentRows = sqlite
    .prepare(
      `SELECT * FROM attachments WHERE record_id IN (${placeholders(
        recordIds.length
      )})`
    )
    .all(...recordIds) as AttachmentRow[];
  const customValueRows = sqlite
    .prepare(
      `SELECT v.*, cf.type FROM record_field_values v JOIN custom_fields cf ON cf.id = v.field_id WHERE v.record_id IN (${placeholders(
        recordIds.length
      )})`
    )
    .all(...recordIds) as CustomValueRow[];

  const mapped = mapRecords(rows);
  const withRelations = attachRelations(mapped, tagRows, attachmentRows, customValueRows);
  withRelations.forEach((rec) => {
    rec.complianceSelections = mapComplianceSelections(rec.id!);
    rec.entryEmotion = (rows.find((r) => r.id === rec.id)?.entry_emotion) ?? undefined;
    rec.exitEmotion = (rows.find((r) => r.id === rec.id)?.exit_emotion) ?? undefined;
  });
  return {
    items: withRelations,
    total
  };
}

export function getRecordById(id: number): RecordWithRelations | null {
  const row = sqlite
    .prepare(`SELECT * FROM records WHERE id = ? LIMIT 1`)
    .get(id) as RecordRow | undefined;
  if (!row) return null;

  const tags = sqlite
    .prepare(
      `SELECT rt.record_id, t.* FROM record_tags rt JOIN tags t ON t.id = rt.tag_id WHERE rt.record_id = ?`
    )
    .all(id) as (TagRow & { record_id: number })[];
  const attachments = sqlite
    .prepare(`SELECT * FROM attachments WHERE record_id = ?`)
    .all(id) as AttachmentRow[];
  const customValues = sqlite
    .prepare(
      `SELECT v.*, cf.type FROM record_field_values v JOIN custom_fields cf ON cf.id = v.field_id WHERE v.record_id = ?`
    )
    .all(id) as CustomValueRow[];

  const mapped = mapRecords([row])[0];
  const withRelations = attachRelations([mapped], tags, attachments, customValues)[0];
  withRelations.complianceSelections = mapComplianceSelections(id);
  return withRelations;
}

export function createRecord(input: RecordInput): RecordWithRelations {
  const now = dayjs().toISOString();
  const trx = sqlite.transaction(() => {
    const info = sqlite
      .prepare(
        `INSERT INTO records (datetime, symbol, account_type, result, r_multiple, entry_emotion, exit_emotion, complied, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.datetime,
        input.symbol,
        input.accountType,
        input.result,
        input.rMultiple ?? null,
        input.entryEmotion ?? null,
        input.exitEmotion ?? null,
        0,
        input.notes ?? "",
        now,
        now
      );
    const recordId = Number(info.lastInsertRowid);
    setRecordTags(recordId, input.tagIds ?? []);
    setRecordCustomValues(recordId, input.customValues ?? []);
    setRecordAttachments(recordId, input.attachmentIds ?? []);
    setComplianceSelections(recordId, input.complianceSelections ?? []);
    const computedComplied = computeComplied(
      input.complianceSelections ?? [],
      input.complied ?? false
    );
    sqlite.prepare(`UPDATE records SET complied = ? WHERE id = ?`).run(
      computedComplied ? 1 : 0,
      recordId
    );
    sqlite
      .prepare(
        `UPDATE records SET entry_emotion = ?, exit_emotion = ? WHERE id = ?`
      )
      .run(input.entryEmotion ?? null, input.exitEmotion ?? null, recordId);
    return recordId;
  });
  const recordId = trx();
  const record = getRecordById(recordId);
  if (!record) {
    throw new Error("Failed to create record");
  }
  return record;
}

export function updateRecord(id: number, input: RecordUpdate) {
  const current = getRecordById(id);
  if (!current) {
    throw new Error("Record not found");
  }
  const now = dayjs().toISOString();
  const trx = sqlite.transaction(() => {
    const existing = { ...current, ...input };
    sqlite
      .prepare(
        `UPDATE records SET datetime = ?, symbol = ?, account_type = ?, result = ?, r_multiple = ?, complied = ?, notes = ?, updated_at = ?, entry_emotion = ?, exit_emotion = ? WHERE id = ?`
      )
      .run(
        existing.datetime,
        existing.symbol,
        existing.accountType,
        existing.result,
        existing.rMultiple ?? null,
        existing.complied ? 1 : 0,
        existing.notes ?? "",
        now,
        existing.entryEmotion ?? null,
        existing.exitEmotion ?? null,
        id
      );
    if (input.tagIds) {
      setRecordTags(id, input.tagIds);
    }
    if (input.customValues) {
      setRecordCustomValues(id, input.customValues);
    }
    if (input.attachmentIds) {
      setRecordAttachments(id, input.attachmentIds);
    }
    if (input.complianceSelections) {
      setComplianceSelections(id, input.complianceSelections);
    }
    const computedComplied = computeComplied(
      input.complianceSelections ?? current.complianceSelections ?? [],
      input.complied ?? current.complied
    );
    sqlite.prepare(`UPDATE records SET complied = ? WHERE id = ?`).run(
      computedComplied ? 1 : 0,
      id
    );
    sqlite
      .prepare(
        `UPDATE records SET entry_emotion = ?, exit_emotion = ? WHERE id = ?`
      )
      .run(existing.entryEmotion ?? null, existing.exitEmotion ?? null, id);
  });
  trx();
  const record = getRecordById(id);
  if (!record) {
    throw new Error("Failed to load record after update");
  }
  return record;
}

export function bulkDelete(recordIds: number[]) {
  if (!recordIds.length) return;
  const attachments = sqlite
    .prepare(
      `SELECT file_path FROM attachments WHERE record_id IN (${placeholders(
        recordIds.length
      )})`
    )
    .all(...recordIds) as { file_path: string }[];
  const trx = sqlite.transaction(() => {
    sqlite
      .prepare(
        `DELETE FROM records WHERE id IN (${placeholders(recordIds.length)})`
      )
      .run(...recordIds);
  });
  trx();
  // Delete files from disk
  for (const att of attachments) {
    const filePath = path.isAbsolute(att.file_path)
      ? att.file_path
      : path.join(uploadsDir, att.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

export function bulkUpdateTags(recordIds: number[], tagIds: number[]) {
  const trx = sqlite.transaction(() => {
    for (const id of recordIds) {
      setRecordTags(id, tagIds);
    }
  });
  trx();
}
