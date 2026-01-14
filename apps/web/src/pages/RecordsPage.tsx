import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AnalyticsSummary,
  BreakdownRow,
  CustomField,
  PaginatedRecords,
  RecordFilters,
  RecordInput,
  RecordUpdate,
  RecordWithRelations,
  Tag,
  ComplianceCheck,
  Setup
} from "@trading-logger/shared";
import { api } from "../api/client";
import RecordForm from "../components/RecordForm";
import RecordCard from "../components/RecordCard";

export default function RecordsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Partial<RecordFilters>>({
    page: 1,
    pageSize: 12
  });
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<RecordWithRelations | null>(null);

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: api.listTags
  });
  const { data: setups = [] } = useQuery<Setup[]>({
    queryKey: ["setups"],
    queryFn: api.listSetups
  });
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ["customFields"],
    queryFn: api.listCustomFields
  });
  const { data: complianceChecks = [] } = useQuery<ComplianceCheck[]>({
    queryKey: ["complianceChecks"],
    queryFn: api.listComplianceChecks
  });

  const recordQuery = useQuery<PaginatedRecords>({
    queryKey: ["records", filters],
    queryFn: () => api.getRecords(filters)
  });

  const summaryQuery = useQuery<AnalyticsSummary>({
    queryKey: ["analytics", "summary", filters],
    queryFn: () => api.analyticsSummary(filters)
  });
  const tagBreakdown = useQuery<BreakdownRow[]>({
    queryKey: ["analytics", "tag", filters],
    queryFn: () => api.analyticsGroupBy(filters, "tag")
  });
  const setupBreakdown = useQuery<BreakdownRow[]>({
    queryKey: ["analytics", "setup", filters],
    queryFn: () => api.analyticsGroupBy(filters, "setup")
  });
  const resultBreakdown = useQuery<BreakdownRow[]>({
    queryKey: ["analytics", "result", filters],
    queryFn: () => api.analyticsGroupBy(filters, "result")
  });

  const createMutation = useMutation({
    mutationFn: (payload: RecordInput) => api.createRecord(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });
  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; data: RecordUpdate }) =>
      api.updateRecord(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => api.deleteRecords(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });

  const handleSave = async (payload: RecordInput) => {
    if (formMode === "edit" && editing?.id) {
      const updatePayload: RecordUpdate = { ...payload, id: editing.id };
      await updateMutation.mutateAsync({
        id: editing.id,
        data: updatePayload
      });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setFormMode(null);
    setEditing(null);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync([id]);
    if (editing?.id === id) {
      setFormMode(null);
      setEditing(null);
    }
  };

  const records = recordQuery.data?.items ?? [];
  const total = recordQuery.data?.total ?? 0;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / (filters.pageSize ?? 12))),
    [total, filters.pageSize]
  );

  const startNew = () => {
    setFormMode("create");
    setEditing(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (record: RecordWithRelations) => {
    setEditing(record);
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateFilters = (next: Partial<RecordFilters>) =>
    setFilters((f) => ({ ...f, ...next, page: 1 }));

  return (
    <div className="records-page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "0.75rem"
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Records & Analysis</h2>
          <div style={{ opacity: 0.7, fontSize: "0.9rem" }}>
            Filter trades, review stats, and edit records in one view.
          </div>
        </div>
        <button className="btn" onClick={startNew}>
          New Record
        </button>
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

          <AnalyticsPanel
            summary={summaryQuery.data}
            loading={summaryQuery.isLoading}
            tagRows={tagBreakdown.data ?? []}
            setupRows={setupBreakdown.data ?? []}
            resultRows={resultBreakdown.data ?? []}
          />
        </aside>

        <section className="records-main">
          {formMode && (
            <RecordForm
              key={formMode === "edit" ? editing?.id ?? "edit" : "create"}
              initial={formMode === "edit" ? editing : null}
              tags={tags}
              setups={setups}
              customFields={customFields}
              complianceChecks={complianceChecks}
              onSaved={handleSave}
              onCancel={() => {
                setFormMode(null);
                setEditing(null);
              }}
            />
          )}

          <div className="record-grid">
            {records.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onEdit={startEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {records.length === 0 && (
            <div className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
              No records match the current filters.
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              justifyContent: "flex-end"
            }}
          >
            <span style={{ opacity: 0.75 }}>
              Page {filters.page} / {totalPages}
            </span>
            <button
              className="btn secondary"
              disabled={filters.page === 1}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  page: Math.max(1, (f.page ?? 1) - 1)
                }))
              }
            >
              Prev
            </button>
            <button
              className="btn secondary"
              disabled={filters.page === totalPages}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  page: Math.min(totalPages, (f.page ?? 1) + 1)
                }))
              }
            >
              Next
            </button>
          </div>
        </section>
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
  const emotions = [
  { value: "fear", label: "恐惧/焦虑" },
  { value: "greed", label: "贪婪/兴奋" },
  { value: "anger", label: "愤怒/报复" },
  { value: "overconfidence", label: "自负/亢奋" },
  { value: "regret", label: "懊悔/错过恐惧" },
  { value: "hope", label: "希望/否认" },
  { value: "boredom", label: "无聊/寻刺激" },
  { value: "fatigue", label: "疲劳/麻木" },
  { value: "confusion", label: "困惑/信息过载" },
  { value: "calm", label: "平静/专注" }
];
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
        <div>
          <div style={{ fontWeight: 700 }}>Filters</div>
          <div style={{ opacity: 0.65, fontSize: "0.9rem" }}>
            Narrow records and analytics
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
            <option value="">All</option>
            {tags?.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div>Entry Emotion</div>
          <select
            className="select"
            value={filters.entryEmotion?.[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                entryEmotion: e.target.value ? [e.target.value as any] : undefined
              })
            }
          >
            <option value="">Any</option>
            {emotions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div>Exit Emotion</div>
          <select
            className="select"
            value={filters.exitEmotion?.[0] ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                exitEmotion: e.target.value ? [e.target.value as any] : undefined
              })
            }
          >
            <option value="">Any</option>
            {emotions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function AnalyticsPanel({
  summary,
  loading,
  tagRows,
  setupRows,
  resultRows
}: {
  summary?: AnalyticsSummary;
  loading: boolean;
  tagRows: BreakdownRow[];
  setupRows: BreakdownRow[];
  resultRows: BreakdownRow[];
}) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div>
        <div style={{ fontWeight: 700 }}>Analysis</div>
        <div style={{ opacity: 0.65, fontSize: "0.9rem" }}>
          Updates instantly with filters
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {summary && (
        <div className="analytics-grid">
          <Stat label="Trades" value={summary.totalTrades} />
          <Stat label="Win Rate" value={`${(summary.winRate * 100).toFixed(1)}%`} />
          <Stat label="Profit Factor" value={summary.profitFactor} />
          <Stat label="Expectancy (R)" value={summary.expectancy} />
          <Stat label="Avg R" value={summary.avgR} />
          <Stat label="Avg Win R" value={summary.avgWinR} />
          <Stat label="Avg Loss R" value={summary.avgLossR} />
          <Stat label="Payoff Ratio" value={summary.payoffRatio} />
        </div>
      )}

      <Breakdown title="By Result" rows={resultRows} />
      <Breakdown title="Top Setups" rows={setupRows} />
      <Breakdown title="Top Tags" rows={tagRows} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  const formatValue = (v: any) => {
    if (v === null || v === undefined) return "-";
    if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
    return v;
  };
  return (
    <div
      style={{
        background: "#f7f8fb",
        border: "1px solid #e6e9f0",
        borderRadius: 12,
        padding: "0.7rem 0.8rem"
      }}
    >
      <div style={{ opacity: 0.7, fontSize: "0.9rem" }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{formatValue(value)}</div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const top = rows.slice(0, 4);
  const formatWinRate = (v: number | null | undefined) =>
    v === null || v === undefined ? "-" : `${(v * 100).toFixed(0)}%`;
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>{title}</div>
      {top.length === 0 ? (
        <div style={{ opacity: 0.65 }}>No data</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {top.map((row) => (
            <div
              key={row.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.45rem 0.55rem",
                borderRadius: 10,
                background: "#f7f8fb",
                border: "1px solid #e6e9f0"
              }}
            >
              <div style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
                <span className="pill">{row.label}</span>
                <span style={{ opacity: 0.75 }}>{row.trades} trades</span>
              </div>
              <div style={{ fontWeight: 700 }}>{formatWinRate(row.winRate)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

