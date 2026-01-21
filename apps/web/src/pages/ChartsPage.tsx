import { useMemo, useState } from "react";
import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  BreakdownRow,
  RecordFilters,
  Setup,
  Tag
} from "@trading-logger/shared";
import { api } from "../api/client";

type ChartGroupBy = "tag" | "setup" | "symbol" | "accountType" | "result" | "complied";
type ChartMetricKey = "wins" | "losses" | "breakeven" | "winRate" | "profitFactor" | "expectancy";
type ChartSortKey = ChartMetricKey | "trades" | "label";

type ChartConfig = {
  id: string;
  title: string;
  type: "table";
  groupBy: ChartGroupBy;
  metrics: ChartMetricKey[];
  sortBy: ChartSortKey;
  sortDir: "asc" | "desc";
};

const groupByOptions: { value: ChartGroupBy; label: string }[] = [
  { value: "tag", label: "Tag" },
  { value: "setup", label: "Setup" },
  { value: "symbol", label: "Symbol" },
  { value: "accountType", label: "Account Type" },
  { value: "result", label: "Result" },
  { value: "complied", label: "Complied" }
];

const metricOptions: { key: ChartMetricKey; label: string; hint?: string }[] = [
  { key: "winRate", label: "Win %" },
  { key: "profitFactor", label: "Profit Factor" },
  { key: "expectancy", label: "Expectancy (R)" },
  { key: "wins", label: "Wins" },
  { key: "losses", label: "Losses" },
  { key: "breakeven", label: "Breakeven" }
];

const columnMeta: Record<
  ChartSortKey,
  { label: string; format: (value: any) => string }
> = {
  label: {
    label: "Label",
    format: (v) => (v === null || v === undefined ? "-" : String(v))
  },
  trades: {
    label: "Trades",
    format: (v) => (v === null || v === undefined ? "-" : String(v))
  },
  wins: {
    label: "Wins",
    format: (v) => (v === null || v === undefined ? "-" : String(v))
  },
  losses: {
    label: "Losses",
    format: (v) => (v === null || v === undefined ? "-" : String(v))
  },
  breakeven: {
    label: "Breakeven",
    format: (v) => (v === null || v === undefined ? "-" : String(v))
  },
  winRate: {
    label: "Win %",
    format: (v) =>
      v === null || v === undefined
        ? "-"
        : `${Number(v * 100).toFixed(1)}%`
  },
  profitFactor: {
    label: "Profit Factor",
    format: (v) =>
      v === null || v === undefined
        ? "-"
        : Number(v).toFixed(2)
  },
  expectancy: {
    label: "Expectancy (R)",
    format: (v) =>
      v === null || v === undefined
        ? "-"
        : Number(v).toFixed(2)
  }
};

export default function ChartsPage() {
  const [filters, setFilters] = useState<Partial<RecordFilters>>({
    page: 1,
    pageSize: 12
  });
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([
    {
      id: "chart-default",
      title: "Tags overview",
      type: "table",
      groupBy: "tag",
      metrics: ["winRate", "profitFactor", "expectancy"],
      sortBy: "trades",
      sortDir: "desc"
    }
  ]);

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: api.listTags
  });
  const { data: setups = [] } = useQuery<Setup[]>({
    queryKey: ["setups"],
    queryFn: api.listSetups
  });

  const chartQueries = useQueries({
    queries: chartConfigs.map((chart) => ({
      queryKey: ["analytics", "chart", chart.groupBy, filters],
      queryFn: () => api.analyticsGroupBy(filters, chart.groupBy)
    }))
  });

  const updateFilters = (next: Partial<RecordFilters>) => {
    setFilters((f) => ({ ...f, ...next, page: 1 }));
  };

  const addChart = (payload: Omit<ChartConfig, "id">) => {
    setChartConfigs((prev) => [
      ...prev,
      { ...payload, id: `chart-${Date.now()}-${prev.length}` }
    ]);
  };

  const updateChart = (
    id: string,
    updater: (chart: ChartConfig) => ChartConfig
  ) => {
    setChartConfigs((prev) =>
      prev.map((chart) => {
        if (chart.id !== id) return chart;
        const next = updater(chart);
        const allowedSortKeys: ChartSortKey[] = [
          "label",
          "trades",
          ...next.metrics
        ];
        return allowedSortKeys.includes(next.sortBy)
          ? next
          : { ...next, sortBy: "trades", sortDir: "desc" };
      })
    );
  };

  const removeChart = (id: string) => {
    setChartConfigs((prev) => prev.filter((chart) => chart.id !== id));
  };

  return (
    <div className="records-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem"
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Charts</h2>
          <div style={{ opacity: 0.7 }}>
            Build pivot-style charts on the fly without saving to the database.
          </div>
        </div>
      </div>

      <div className="split-grid">
        <aside className="sidebar">
          <FilterPanel
            filters={filters}
            tags={tags}
            setups={setups}
            onChange={updateFilters}
            onReset={() => setFilters({ page: 1, pageSize: 12 })}
          />
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: "0.4rem" }}>
              How it works
            </div>
            <div style={{ opacity: 0.7, fontSize: "0.95rem", lineHeight: 1.5 }}>
              Adjust filters to scope data, then add table charts with your
              preferred group (tags, setups, symbols, etc.). Columns can be
              rearranged via sorting and new chart types can plug into the same
              config in the future.
            </div>
          </div>
        </aside>

        <section className="records-main">
          <ChartBuilder onAdd={addChart} />

          <div className="record-grid">
            {chartConfigs.map((chart, idx) => (
              <ChartCard
                key={chart.id}
                chart={chart}
                query={chartQueries[idx]}
                onUpdate={(updater) => updateChart(chart.id, updater)}
                onRemove={() => removeChart(chart.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ChartBuilder({
  onAdd
}: {
  onAdd: (chart: Omit<ChartConfig, "id">) => void;
}) {
  const [title, setTitle] = useState("Table chart");
  const [groupBy, setGroupBy] = useState<ChartGroupBy>("tag");
  const [metrics, setMetrics] = useState<ChartMetricKey[]>([
    "winRate",
    "profitFactor",
    "expectancy"
  ]);

  const toggleMetric = (key: ChartMetricKey) => {
    setMetrics((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
        <div>
          <div style={{ fontWeight: 700 }}>Chart Builder</div>
          <div style={{ opacity: 0.65 }}>
            Add multiple table charts. Trades column is always included.
          </div>
        </div>
        <button
          className="btn"
          type="button"
          onClick={() =>
            onAdd({
              title: title || "Table chart",
              type: "table",
              groupBy,
              metrics,
              sortBy: "trades",
              sortDir: "desc"
            })
          }
        >
          Add chart
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "0.75rem", alignItems: "flex-start" }}>
        <label>
          <div>Title</div>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My pivot view"
          />
        </label>
        <label>
          <div>Group by</div>
          <select
            className="select"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as ChartGroupBy)}
          >
            {groupByOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <div>Metrics</div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.35rem",
              marginTop: "0.35rem"
            }}
          >
            {metricOptions.map((opt) => {
              const selected = metrics.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleMetric(opt.key)}
                  style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: 999,
                    border: "1px solid #d5d9e3",
                    background: selected ? "#0a84ff" : "#fff",
                    color: selected ? "#fff" : "#0b1d32",
                    cursor: "pointer"
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  chart,
  query,
  onUpdate,
  onRemove
}: {
  chart: ChartConfig;
  query: UseQueryResult<BreakdownRow[], unknown>;
  onUpdate: (updater: (chart: ChartConfig) => ChartConfig) => void;
  onRemove: () => void;
}) {
  const rows = query.data ?? [];
  const metricKeys: (ChartMetricKey | "trades")[] = useMemo(
    () => ["trades", ...chart.metrics],
    [chart.metrics]
  );

  const sortedRows = useMemo(() => {
    const list = [...rows];
    const valueFor = (row: BreakdownRow, key: ChartSortKey) =>
      key === "label" ? row.label : (row as any)[key];
    const compare = (a: BreakdownRow, b: BreakdownRow) => {
      const aVal = valueFor(a, chart.sortBy);
      const bVal = valueFor(b, chart.sortBy);
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === "string" || typeof bVal === "string") {
        return String(aVal).localeCompare(String(bVal));
      }
      return Number(aVal) - Number(bVal);
    };
    list.sort((a, b) =>
      chart.sortDir === "asc" ? compare(a, b) : compare(b, a)
    );
    return list;
  }, [rows, chart.sortBy, chart.sortDir]);

  const handleToggleMetric = (key: ChartMetricKey) => {
    onUpdate((c) => {
      const nextMetrics = c.metrics.includes(key)
        ? c.metrics.filter((m) => m !== key)
        : [...c.metrics, key];
      const allowedSortKeys: ChartSortKey[] = [
        "label",
        "trades",
        ...nextMetrics
      ];
      const sortBy = allowedSortKeys.includes(c.sortBy)
        ? c.sortBy
        : "trades";
      return { ...c, metrics: nextMetrics, sortBy };
    });
  };

  const handleSort = (key: ChartSortKey) => {
    onUpdate((c) => ({
      ...c,
      sortBy: key,
      sortDir: c.sortBy === key && c.sortDir === "desc" ? "asc" : "desc"
    }));
  };

  const groupLabel = groupByOptions.find((g) => g.value === chart.groupBy)?.label ?? chart.groupBy;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{chart.title}</div>
          <div style={{ opacity: 0.65 }}>
            {groupLabel} pivot - type: {chart.type}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button className="btn secondary" type="button" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      <details style={{ background: "#f7f8fb", border: "1px solid #e6e9f0", borderRadius: 12, padding: "0.6rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, marginBottom: "0.35rem" }}>
          Config
        </summary>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0.6rem" }}>
          <label>
            <div>Title</div>
            <input
              className="input"
              value={chart.title}
              onChange={(e) =>
                onUpdate((c) => ({ ...c, title: e.target.value }))
              }
            />
          </label>
          <label>
            <div>Group by</div>
            <select
              className="select"
              value={chart.groupBy}
              onChange={(e) =>
                onUpdate((c) => ({
                  ...c,
                  groupBy: e.target.value as ChartGroupBy
                }))
              }
            >
              {groupByOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div>Sort by</div>
            <select
              className="select"
              value={chart.sortBy}
              onChange={(e) =>
                onUpdate((c) => ({
                  ...c,
                  sortBy: e.target.value as ChartSortKey
                }))
              }
            >
              {["label", "trades", ...chart.metrics].map((key) => (
                <option key={key} value={key}>
                  {columnMeta[key as ChartSortKey]?.label ?? key}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.25rem" }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  onUpdate((c) => ({
                    ...c,
                    sortDir: c.sortDir === "asc" ? "desc" : "asc"
                  }))
                }
              >
                Direction: {chart.sortDir === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </label>
          <div>
            <div>Metrics</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.25rem" }}>
              {metricOptions.map((opt) => {
                const selected = chart.metrics.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleToggleMetric(opt.key)}
                    style={{
                      padding: "0.35rem 0.55rem",
                      borderRadius: 999,
                      border: "1px solid #d5d9e3",
                      background: selected ? "#0a84ff" : "#fff",
                      color: selected ? "#fff" : "#0b1d32",
                      cursor: "pointer"
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </details>

      <div style={{ overflowX: "auto" }}>
        {query.isLoading ? (
          <div>Loading...</div>
        ) : query.error ? (
          <div style={{ color: "#b91c1c" }}>Failed to load chart data</div>
        ) : rows.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No data for the current filters.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{ textAlign: "left", padding: "0.4rem", cursor: "pointer" }}
                  onClick={() => handleSort("label")}
                >
                  {groupLabel}{" "}
                  {chart.sortBy === "label"
                    ? chart.sortDir === "asc"
                      ? "(asc)"
                      : "(desc)"
                    : ""}
                </th>
                {metricKeys.map((key) => (
                  <th
                    key={key}
                    style={{ textAlign: "right", padding: "0.4rem", cursor: "pointer" }}
                    onClick={() => handleSort(key)}
                  >
                    {columnMeta[key]?.label ?? key}{" "}
                    {chart.sortBy === key
                      ? chart.sortDir === "asc"
                        ? "(asc)"
                        : "(desc)"
                      : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.key} style={{ borderTop: "1px solid #e6e9f0" }}>
                  <td style={{ padding: "0.45rem 0.4rem" }}>{row.label}</td>
                  {metricKeys.map((key) => (
                    <td key={key} style={{ padding: "0.45rem 0.4rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      {columnMeta[key]?.format((row as any)[key]) ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FilterPanel({
  filters,
  tags,
  setups,
  onChange,
  onReset
}: {
  filters: Partial<RecordFilters>;
  tags: Tag[];
  setups: Setup[];
  onChange: (f: Partial<RecordFilters>) => void;
  onReset: () => void;
}) {
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const selectedTagIds = filters.tagIds ?? [];
  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id!));

  const toggleTag = (id: number) => {
    const current = filters.tagIds ?? [];
    const next = current.includes(id)
      ? current.filter((t) => t !== id)
      : [...current, id];
    onChange({
      ...filters,
      tagIds: next.length ? next : undefined
    });
  };

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
        <div>
          <div style={{ fontWeight: 700 }}>Filters</div>
          <div style={{ opacity: 0.65, fontSize: "0.9rem" }}>
            Applies to all charts
          </div>
        </div>
        <button className="btn secondary" type="button" onClick={onReset}>
          Reset
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
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
          <div>Symbol</div>
          <input
            className="input"
            placeholder="AAPL"
            value={filters.symbols?.[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                symbols: e.target.value ? [e.target.value] : undefined
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
          <div>Setup</div>
          <select
            className="select"
            value={filters.setupIds?.[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                setupIds: e.target.value ? [Number(e.target.value)] : undefined
              })
            }
          >
            <option value="">All</option>
            {setups?.map((setup) => (
              <option key={setup.id} value={setup.id}>
                {setup.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div>Tags</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", flex: 1 }}>
              {selectedTags.length === 0 ? (
                <span
                  className="pill"
                  style={{ background: "#eef2ff", border: "1px solid #e6e9f0" }}
                >
                  All tags
                </span>
              ) : (
                selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="pill"
                    style={{ background: "#eef2ff", border: "1px solid #e6e9f0" }}
                  >
                    {tag.name}
                  </span>
                ))
              )}
            </div>
            <button
              type="button"
              className="btn secondary"
              style={{ padding: "0.35rem 0.6rem" }}
              onClick={() => setTagMenuOpen((o) => !o)}
            >
              {tagMenuOpen ? "Close" : "Select"}
            </button>
          </div>
          {tagMenuOpen && (
            <div
              className="card"
              style={{
                marginTop: "0.5rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                background: "#f7f8fb"
              }}
            >
              <button
                type="button"
                className="btn secondary"
                style={{ padding: "0.35rem 0.6rem" }}
                onClick={() => {
                  onChange({ ...filters, tagIds: undefined });
                  setTagMenuOpen(false);
                }}
              >
                All tags
              </button>
              {tags?.map((tag) => {
                const selected = selectedTagIds.includes(tag.id!);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id!)}
                    style={{
                      padding: "0.35rem 0.6rem",
                      borderRadius: "999px",
                      border: "1px solid #d5d9e3",
                      background: selected ? "#2563eb" : "#fff",
                      color: selected ? "#fff" : "#111827",
                      cursor: "pointer"
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </label>
      </div>
    </div>
  );
}
