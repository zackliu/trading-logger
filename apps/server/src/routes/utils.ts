import {
  CustomFieldFilter,
  RecordFilters
} from "@trading-logger/shared";

const toArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v : String(v)))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return undefined;
};

const toNumberArray = (value: unknown): number[] | undefined => {
  const arr = toArray(value);
  if (!arr) return undefined;
  const nums = arr
    .map((v) => Number(v))
    .filter((v) => !Number.isNaN(v) && Number.isFinite(v));
  return nums.length ? nums : undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
};

const parseCustomFieldFilters = (
  value: unknown
): CustomFieldFilter[] | undefined => {
  if (!value) return undefined;
  try {
    if (typeof value === "string") {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    }
    if (Array.isArray(value)) return value as CustomFieldFilter[];
  } catch (err) {
    return undefined;
  }
  return undefined;
};

export const parseRecordFilters = (
  query: Record<string, any>
): Partial<RecordFilters> => {
  const page = query.page ? Number(query.page) : undefined;
  const pageSize = query.pageSize ? Number(query.pageSize) : undefined;
  return {
    page: Number.isFinite(page) ? page : undefined,
    pageSize: Number.isFinite(pageSize) ? pageSize : undefined,
    start: query.start,
    end: query.end,
    symbols: toArray(query.symbols),
    tagIds: toNumberArray(query.tagIds),
    setupIds: toNumberArray(query.setupIds),
    complied: toBoolean(query.complied),
    accountTypes: toArray(query.accountTypes) as any,
    results: toArray(query.results) as any,
    customFieldFilters: parseCustomFieldFilters(query.customFieldFilters)
  };
};
