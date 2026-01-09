import { RecordFilters } from "@trading-logger/shared";

const placeholder = (count: number) => new Array(count).fill("?").join(", ");

export function normalizeFilters(filters: Partial<RecordFilters>): RecordFilters {
  return {
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 20,
    start: filters.start,
    end: filters.end,
    symbols: filters.symbols?.filter(Boolean),
    tagIds: filters.tagIds?.length ? filters.tagIds : undefined,
    complied: filters.complied,
    accountTypes: filters.accountTypes?.length
      ? filters.accountTypes
      : undefined,
    results: filters.results?.length ? filters.results : undefined,
    minPnl: filters.minPnl,
    maxPnl: filters.maxPnl,
    customFieldFilters: filters.customFieldFilters?.filter(Boolean)
  };
}

export function buildRecordWhereClause(filters: RecordFilters) {
  const clauses: string[] = ["1=1"];
  const params: (string | number | boolean)[] = [];

  if (filters.start) {
    clauses.push("r.datetime >= ?");
    params.push(filters.start);
  }
  if (filters.end) {
    clauses.push("r.datetime <= ?");
    params.push(filters.end);
  }
  if (filters.symbols?.length) {
    clauses.push(`r.symbol IN (${placeholder(filters.symbols.length)})`);
    params.push(...filters.symbols);
  }
  if (filters.tagIds?.length) {
    clauses.push(
      `EXISTS (SELECT 1 FROM record_tags rt WHERE rt.record_id = r.id AND rt.tag_id IN (${placeholder(
        filters.tagIds.length
      )}))`
    );
    params.push(...filters.tagIds);
  }
  if (filters.complied !== undefined) {
    clauses.push("r.complied = ?");
    params.push(filters.complied ? 1 : 0);
  }
  if (filters.accountTypes?.length) {
    clauses.push(
      `r.account_type IN (${placeholder(filters.accountTypes.length)})`
    );
    params.push(...filters.accountTypes);
  }
  if (filters.results?.length) {
    clauses.push(`r.result IN (${placeholder(filters.results.length)})`);
    params.push(...filters.results);
  }
  if (filters.minPnl !== undefined) {
    clauses.push("r.pnl >= ?");
    params.push(filters.minPnl);
  }
  if (filters.maxPnl !== undefined) {
    clauses.push("r.pnl <= ?");
    params.push(filters.maxPnl);
  }

  for (const cf of filters.customFieldFilters ?? []) {
    switch (cf.type) {
      case "text":
        clauses.push(
          `EXISTS (SELECT 1 FROM record_field_values v WHERE v.record_id = r.id AND v.field_id = ? AND v.value_text = ?)`
        );
        params.push(cf.fieldId, cf.value);
        break;
      case "number": {
        const parts: string[] = [];
        if (cf.min !== undefined) {
          parts.push("v.value_number >= ?");
          params.push(cf.min);
        }
        if (cf.max !== undefined) {
          parts.push("v.value_number <= ?");
          params.push(cf.max);
        }
        clauses.push(
          `EXISTS (SELECT 1 FROM record_field_values v WHERE v.record_id = r.id AND v.field_id = ? ${
            parts.length ? "AND " + parts.join(" AND ") : ""
          })`
        );
        params.push(cf.fieldId);
        break;
      }
      case "boolean":
        clauses.push(
          `EXISTS (SELECT 1 FROM record_field_values v WHERE v.record_id = r.id AND v.field_id = ? AND v.value_bool = ?)`
        );
        params.push(cf.fieldId, cf.value ? 1 : 0);
        break;
      case "singleSelect":
      case "multiSelect":
        if (cf.values.length) {
          clauses.push(
            `EXISTS (SELECT 1 FROM record_field_values v WHERE v.record_id = r.id AND v.field_id = ? AND v.value_text IN (${placeholder(
              cf.values.length
            )}))`
          );
          params.push(cf.fieldId, ...cf.values);
        }
        break;
      case "date":
      case "datetime": {
        const conditions: string[] = [];
        if (cf.start) {
          conditions.push(
            cf.type === "date" ? "v.value_date >= ?" : "v.value_datetime >= ?"
          );
          params.push(cf.start);
        }
        if (cf.end) {
          conditions.push(
            cf.type === "date" ? "v.value_date <= ?" : "v.value_datetime <= ?"
          );
          params.push(cf.end);
        }
        clauses.push(
          `EXISTS (SELECT 1 FROM record_field_values v WHERE v.record_id = r.id AND v.field_id = ? ${
            conditions.length ? "AND " + conditions.join(" AND ") : ""
          })`
        );
        params.push(cf.fieldId);
        break;
      }
      default:
        break;
    }
  }

  return {
    where: clauses.join(" AND "),
    params
  };
}
