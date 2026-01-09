import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  CustomField,
  CustomFieldFilter,
  RecordFilters,
  Tag,
  AnalyticsSummary,
  BreakdownRow,
  PaginatedRecords
} from "@trading-logger/shared";
import { api, getAttachmentUrl } from "../api/client";
import { formatDateTime } from "../utils/format";

const parseFilters = (params: URLSearchParams): Partial<RecordFilters> => {
  const tagIds = params.getAll("tagIds").map((t) => Number(t)).filter(Boolean);
  const accountTypes = params.getAll("accountTypes") as any[];
  const results = params.getAll("results") as any[];
  const symbols = params.getAll("symbols");
  const compliedRaw = params.get("complied");
  const customFieldFilters = params.get("cff")
    ? (JSON.parse(params.get("cff") || "[]") as CustomFieldFilter[])
    : undefined;
  return {
    start: params.get("start") || undefined,
    end: params.get("end") || undefined,
    tagIds: tagIds.length ? tagIds : undefined,
    accountTypes: accountTypes.length ? accountTypes : undefined,
    results: results.length ? results : undefined,
    symbols: symbols.length ? symbols : undefined,
    complied:
      compliedRaw === undefined || compliedRaw === null || compliedRaw === ""
        ? undefined
        : compliedRaw === "true",
    customFieldFilters
  };
};

const toParams = (filters: Partial<RecordFilters>) => {
  const params = new URLSearchParams();
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  filters.tagIds?.forEach((t) => params.append("tagIds", String(t)));
  filters.accountTypes?.forEach((a) => params.append("accountTypes", a));
  filters.results?.forEach((r) => params.append("results", r));
  filters.symbols?.forEach((s) => params.append("symbols", s));
  if (filters.complied !== undefined)
    params.set("complied", String(filters.complied));
  if (filters.customFieldFilters?.length) {
    params.set("cff", JSON.stringify(filters.customFieldFilters));
  }
  return params;
};

export default function AnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => parseFilters(searchParams),
    [searchParams.toString()]
  );
  const [customFieldGroup, setCustomFieldGroup] = useState<string | null>(null);
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: api.listTags
  });
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ["customFields"],
    queryFn: api.listCustomFields
  });

  const summaryQuery = useQuery<AnalyticsSummary>({
    queryKey: ["analytics", "summary", filters],
    queryFn: () => api.analyticsSummary(filters)
  });
  const tagBreakdown = useQuery<BreakdownRow[]>({
    queryKey: ["analytics", "tag", filters],
    queryFn: () => api.analyticsGroupBy(filters, "tag")
  });
  const symbolBreakdown = useQuery<BreakdownRow[]>({
    queryKey: ["analytics", "symbol", filters],
    queryFn: () => api.analyticsGroupBy(filters, "symbol")
  });
  const compliedBreakdown = useQuery<BreakdownRow[]>({
    queryKey: ["analytics", "complied", filters],
    queryFn: () => api.analyticsGroupBy(filters, "complied")
  });
  const accountBreakdown = useQuery<BreakdownRow[]>({
    queryKey: ["analytics", "accountType", filters],
    queryFn: () => api.analyticsGroupBy(filters, "accountType")
  });
  const resultBreakdown = useQuery<BreakdownRow[]>({
    queryKey: ["analytics", "result", filters],
    queryFn: () => api.analyticsGroupBy(filters, "result")
  });
  const customBreakdown = useQuery<BreakdownRow[]>({
    queryKey: ["analytics", "custom", customFieldGroup, filters],
    queryFn: () =>
      customFieldGroup
        ? api.analyticsGroupBy(filters, `customField:${customFieldGroup}`)
        : Promise.resolve([]),
    enabled: !!customFieldGroup
  });

  const recordsQuery = useQuery<PaginatedRecords>({
    queryKey: ["records", "analysis", filters],
    queryFn: () => api.getRecords({ ...filters, page: 1, pageSize: 12 })
  });

  const updateFilters = (next: Partial<RecordFilters>) => {
    const params = toParams(next);
    setSearchParams(params);
  };

  const addCustomFilter = (
    field: CustomField,
    value: string | number | boolean | string[],
    extra?: { min?: number; max?: number; start?: string; end?: string }
  ) => {
    const current = filters.customFieldFilters ?? [];
    let newFilter: CustomFieldFilter;
    switch (field.type) {
      case "number":
        newFilter = {
          fieldId: field.id!,
          type: "number",
          min: extra?.min,
          max: extra?.max
        };
        break;
      case "boolean":
        newFilter = { fieldId: field.id!, type: "boolean", value: Boolean(value) };
        break;
      case "singleSelect":
        newFilter = {
          fieldId: field.id!,
          type: "singleSelect",
          values: [value as string]
        };
        break;
      case "multiSelect":
        newFilter = {
          fieldId: field.id!,
          type: "multiSelect",
          values: Array.isArray(value) ? value : []
        };
        break;
      case "date":
      case "datetime":
        newFilter = {
          fieldId: field.id!,
          type: field.type,
          start: extra?.start,
          end: extra?.end
        } as any;
        break;
      default:
        newFilter = {
          fieldId: field.id!,
          type: field.type as any,
          value: value as string
        };
    }
    updateFilters({
      ...filters,
      customFieldFilters: [...current, newFilter]
    });
  };

  const removeCustomFilter = (index: number) => {
    const next = [...(filters.customFieldFilters ?? [])];
    next.splice(index, 1);
    updateFilters({
      ...filters,
      customFieldFilters: next
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Analysis</h2>
          <div style={{ opacity: 0.7 }}>
            Filter by time, symbol, tags, and custom dimensions.
          </div>
        </div>
        <button className="btn secondary" onClick={() => setSearchParams(new URLSearchParams())}>
          Reset filters
        </button>
      </div>

      <FilterPanel
        filters={filters}
        tags={tags?.map((t) => ({ id: t.id!, label: t.name })) ?? []}
        onChange={(next) => updateFilters({ ...filters, ...next })}
      />

      {customFields && customFields.length > 0 && (
        <CustomFilterBuilder
          fields={customFields}
          onAdd={addCustomFilter}
          activeFilters={filters.customFieldFilters ?? []}
          onRemove={removeCustomFilter}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.75rem",
          margin: "1rem 0"
        }}
      >
        {summaryQuery.data ? (
          <>
            <StatCard label="Total" value={summaryQuery.data.totalTrades} />
            <StatCard
              label="Win Rate"
              value={`${(summaryQuery.data.winRate * 100).toFixed(1)}%`}
            />
            <StatCard label="Expectancy" value={summaryQuery.data.expectancy ?? 0} />
            <StatCard label="Profit Factor" value={summaryQuery.data.profitFactor ?? 0} />
            <StatCard label="Payoff Ratio" value={summaryQuery.data.payoffRatio ?? 0} />
            <StatCard label="Avg R" value={summaryQuery.data.avgR ?? 0} />
          </>
        ) : (
          <div>Loading...</div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <BreakdownTable title="By Tag" data={tagBreakdown.data ?? []} />
        <BreakdownTable title="By Symbol" data={symbolBreakdown.data ?? []} />
        <BreakdownTable title="By Complied" data={compliedBreakdown.data ?? []} />
        <BreakdownTable title="By Account" data={accountBreakdown.data ?? []} />
        <BreakdownTable title="By Result" data={resultBreakdown.data ?? []} />
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Custom Group</h3>
            <select
              className="select"
              value={customFieldGroup ?? ""}
              onChange={(e) => setCustomFieldGroup(e.target.value || null)}
            >
              <option value="">Select field</option>
              {customFields?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          {customBreakdown.data && customBreakdown.data.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
              <thead>
                <tr>
                  <th>Value</th>
                  <th>Trades</th>
                  <th>Win%</th>
                  <th>PF</th>
                  <th>Expectancy</th>
                </tr>
              </thead>
              <tbody>
                {customBreakdown.data.map((row) => (
                  <tr key={row.key} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <td>{row.label}</td>
                    <td>{row.trades}</td>
                    <td>{row.winRate ? (row.winRate * 100).toFixed(1) + "%" : "-"}</td>
                    <td>{row.profitFactor?.toFixed(2) ?? "-"}</td>
                    <td>{row.expectancy?.toFixed(2) ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ marginTop: "0.5rem", opacity: 0.8 }}>Select a field to pivot.</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h3>Records Browser</h3>
        <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "0.75rem" }}>
          {recordsQuery.data?.items.map((r) => (
            <div key={r.id} style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.6rem" }}>
              <div style={{ fontWeight: 600 }}>{r.symbol}</div>
              <div style={{ opacity: 0.7, fontSize: "0.9rem" }}>{formatDateTime(r.datetime)}</div>
              <div style={{ color: r.pnl > 0 ? "#10B981" : r.pnl < 0 ? "#EF4444" : "#E5ECFF", fontWeight: 600 }}>
                {r.pnl}
              </div>
              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                {r.tags.map((t) => (
                  <span key={t.id} className="tag">
                    {t.name}
                  </span>
                ))}
              </div>
              {r.attachments[0] && (
                <img
                  src={getAttachmentUrl(r.attachments[0].filePath)}
                  alt="thumb"
                  style={{ width: "100%", borderRadius: 8, marginTop: "0.35rem" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterPanel({
  filters,
  tags,
  onChange
}: {
  filters: Partial<RecordFilters>;
  tags: { id: number; label: string }[];
  onChange: (f: Partial<RecordFilters>) => void;
}) {
  return (
    <div className="card" style={{ margin: "1rem 0" }}>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <label>
          <div>From</div>
          <input
            className="input"
            type="date"
            value={filters.start ? filters.start.slice(0, 10) : ""}
            onChange={(e) =>
              onChange({
                ...filters,
                start: e.target.value ? new Date(e.target.value).toISOString() : undefined
              })
            }
          />
        </label>
        <label>
          <div>To</div>
          <input
            className="input"
            type="date"
            value={filters.end ? filters.end.slice(0, 10) : ""}
            onChange={(e) =>
              onChange({
                ...filters,
                end: e.target.value ? new Date(e.target.value).toISOString() : undefined
              })
            }
          />
        </label>
        <label>
          <div>Symbols</div>
          <input
            className="input"
            placeholder="Comma separated"
            value={filters.symbols?.join(",") ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                symbols: e.target.value
                  ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  : undefined
              })
            }
          />
        </label>
        <label>
          <div>Account</div>
          <select
            className="select"
            value={filters.accountTypes?.[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                accountTypes: e.target.value ? [e.target.value as any] : undefined
              })
            }
          >
            <option value="">Any</option>
            <option value="live">Live</option>
            <option value="sim">Sim</option>
          </select>
        </label>
        <label>
          <div>Result</div>
          <select
            className="select"
            value={filters.results?.[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                results: e.target.value ? [e.target.value as any] : undefined
              })
            }
          >
            <option value="">Any</option>
            <option value="takeProfit">Take Profit</option>
            <option value="stopLoss">Stop Loss</option>
            <option value="breakeven">Breakeven</option>
            <option value="manualExit">Manual Exit</option>
          </select>
        </label>
        <label>
          <div>Complied</div>
          <select
            className="select"
            value={
              filters.complied === undefined
                ? ""
                : filters.complied
                ? "yes"
                : "no"
            }
            onChange={(e) => {
              const v = e.target.value;
              onChange({
                ...filters,
                complied: v === "" ? undefined : v === "yes"
              });
            }}
          >
            <option value="">Any</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label>
          <div>Tags</div>
          <select
            className="select"
            value={filters.tagIds?.[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                tagIds: e.target.value ? [Number(e.target.value)] : undefined
              })
            }
          >
            <option value="">Any</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="card">
      <div style={{ opacity: 0.7, fontSize: "0.9rem" }}>{label}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function BreakdownTable({
  title,
  data
}: {
  title: string;
  data: any[];
}) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Key</th>
            <th>Trades</th>
            <th>Win%</th>
            <th>PF</th>
            <th>Expectancy</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.key} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <td>{row.label}</td>
              <td>{row.trades}</td>
              <td>{row.winRate ? (row.winRate * 100).toFixed(1) + "%" : "-"}</td>
              <td>{row.profitFactor?.toFixed(2) ?? "-"}</td>
              <td>{row.expectancy?.toFixed(2) ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomFilterBuilder({
  fields,
  onAdd,
  activeFilters,
  onRemove
}: {
  fields: CustomField[];
  activeFilters: CustomFieldFilter[];
  onAdd: (
    field: CustomField,
    value: string | number | boolean | string[],
    extra?: { min?: number; max?: number; start?: string; end?: string }
  ) => void;
  onRemove: (index: number) => void;
}) {
  const [fieldId, setFieldId] = useState<number | null>(null);
  const selectedField = fields.find((f) => f.id === fieldId) ?? null;
  const [textValue, setTextValue] = useState("");
  const [numberMin, setNumberMin] = useState<string>("");
  const [numberMax, setNumberMax] = useState<string>("");
  const [boolValue, setBoolValue] = useState("true");
  const [selectValues, setSelectValues] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <label>
          <div>Custom Field</div>
          <select
            className="select"
            value={fieldId ?? ""}
            onChange={(e) => setFieldId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        {selectedField && renderValueInput()}
        <button
          className="btn secondary"
          disabled={!selectedField}
          onClick={() => {
            if (!selectedField) return;
            if (selectedField.type === "number") {
              onAdd(
                selectedField,
                0,
                {
                  min: numberMin ? Number(numberMin) : undefined,
                  max: numberMax ? Number(numberMax) : undefined
                }
              );
            } else if (selectedField.type === "boolean") {
              onAdd(selectedField, boolValue === "true");
            } else if (selectedField.type === "multiSelect") {
              onAdd(selectedField, selectValues);
            } else if (selectedField.type === "singleSelect") {
              onAdd(selectedField, selectValues[0] ?? "");
            } else if (selectedField.type === "date" || selectedField.type === "datetime") {
              onAdd(selectedField, "", {
                start: dateRange.start,
                end: dateRange.end
              });
            } else {
              onAdd(selectedField, textValue);
            }
          }}
        >
          Add Filter
        </button>
      </div>
      {activeFilters.length > 0 && (
        <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {activeFilters.map((f, idx) => (
            <span key={idx} className="tag">
              {fields.find((fi) => fi.id === f.fieldId)?.label}:{" "}
              {f.type === "number"
                ? `${f.min ?? ""} - ${f.max ?? ""}`
                : f.type === "date" || f.type === "datetime"
                ? `${(f as any).start ?? ""} → ${(f as any).end ?? ""}`
                : "value" in f
                ? (f as any).value ?? ""
                : (f as any).values?.join(",")}
              <button
                style={{
                  marginLeft: "0.35rem",
                  background: "transparent",
                  border: "none",
                  color: "#9CA3AF",
                  cursor: "pointer"
                }}
                onClick={() => onRemove(idx)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  function renderValueInput() {
    if (!selectedField) return null;
    if (selectedField.type === "number") {
      return (
        <>
          <label>
            <div>Min</div>
            <input
              className="input"
              type="number"
              value={numberMin}
              onChange={(e) => setNumberMin(e.target.value)}
            />
          </label>
          <label>
            <div>Max</div>
            <input
              className="input"
              type="number"
              value={numberMax}
              onChange={(e) => setNumberMax(e.target.value)}
            />
          </label>
        </>
      );
    }
    if (selectedField.type === "boolean") {
      return (
        <label>
          <div>Value</div>
          <select
            className="select"
            value={boolValue}
            onChange={(e) => setBoolValue(e.target.value)}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </label>
      );
    }
    if (selectedField.type === "singleSelect" || selectedField.type === "multiSelect") {
      return (
        <label>
          <div>Options</div>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {selectedField.options?.map((opt) => (
              <label key={opt.value}>
                <input
                  type={selectedField.type === "singleSelect" ? "radio" : "checkbox"}
                  name="cf-options"
                  checked={
                    selectedField.type === "singleSelect"
                      ? selectValues[0] === opt.value
                      : selectValues.includes(opt.value)
                  }
                  onChange={(e) => {
                    if (selectedField.type === "singleSelect") {
                      setSelectValues([opt.value]);
                    } else {
                      setSelectValues((prev) =>
                        e.target.checked
                          ? [...prev, opt.value]
                          : prev.filter((v) => v !== opt.value)
                      );
                    }
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </label>
      );
    }
    if (selectedField.type === "date" || selectedField.type === "datetime") {
      return (
        <>
          <label>
            <div>Start</div>
            <input
              className="input"
              type={selectedField.type === "date" ? "date" : "datetime-local"}
              value={dateRange.start ?? ""}
              onChange={(e) =>
                setDateRange((d) => ({
                  ...d,
                  start: e.target.value
                    ? selectedField.type === "date"
                      ? e.target.value
                      : new Date(e.target.value).toISOString()
                    : undefined
                }))
              }
            />
          </label>
          <label>
            <div>End</div>
            <input
              className="input"
              type={selectedField.type === "date" ? "date" : "datetime-local"}
              value={dateRange.end ?? ""}
              onChange={(e) =>
                setDateRange((d) => ({
                  ...d,
                  end: e.target.value
                    ? selectedField.type === "date"
                      ? e.target.value
                      : new Date(e.target.value).toISOString()
                    : undefined
                }))
              }
            />
          </label>
        </>
      );
    }
    return (
      <label style={{ flex: "1 1 240px" }}>
        <div>Value</div>
        <input
          className="input"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
        />
      </label>
    );
  }
}
