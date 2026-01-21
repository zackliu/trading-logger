import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
const groupByOptions = [
    { value: "tag", label: "Tag" },
    { value: "setup", label: "Setup" },
    { value: "symbol", label: "Symbol" },
    { value: "accountType", label: "Account Type" },
    { value: "result", label: "Result" },
    { value: "complied", label: "Complied" }
];
const metricOptions = [
    { key: "winRate", label: "Win %" },
    { key: "profitFactor", label: "Profit Factor" },
    { key: "expectancy", label: "Expectancy (R)" },
    { key: "wins", label: "Wins" },
    { key: "losses", label: "Losses" },
    { key: "breakeven", label: "Breakeven" }
];
const columnMeta = {
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
        format: (v) => v === null || v === undefined
            ? "-"
            : `${Number(v * 100).toFixed(1)}%`
    },
    profitFactor: {
        label: "Profit Factor",
        format: (v) => v === null || v === undefined
            ? "-"
            : Number(v).toFixed(2)
    },
    expectancy: {
        label: "Expectancy (R)",
        format: (v) => v === null || v === undefined
            ? "-"
            : Number(v).toFixed(2)
    }
};
export default function ChartsPage() {
    const [filters, setFilters] = useState({
        page: 1,
        pageSize: 12
    });
    const [chartConfigs, setChartConfigs] = useState([
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
    const { data: tags = [] } = useQuery({
        queryKey: ["tags"],
        queryFn: api.listTags
    });
    const { data: setups = [] } = useQuery({
        queryKey: ["setups"],
        queryFn: api.listSetups
    });
    const chartQueries = useQueries({
        queries: chartConfigs.map((chart) => ({
            queryKey: ["analytics", "chart", chart.groupBy, filters],
            queryFn: () => api.analyticsGroupBy(filters, chart.groupBy)
        }))
    });
    const updateFilters = (next) => {
        setFilters((f) => ({ ...f, ...next, page: 1 }));
    };
    const addChart = (payload) => {
        setChartConfigs((prev) => [
            ...prev,
            { ...payload, id: `chart-${Date.now()}-${prev.length}` }
        ]);
    };
    const updateChart = (id, updater) => {
        setChartConfigs((prev) => prev.map((chart) => {
            if (chart.id !== id)
                return chart;
            const next = updater(chart);
            const allowedSortKeys = [
                "label",
                "trades",
                ...next.metrics
            ];
            return allowedSortKeys.includes(next.sortBy)
                ? next
                : { ...next, sortBy: "trades", sortDir: "desc" };
        }));
    };
    const removeChart = (id) => {
        setChartConfigs((prev) => prev.filter((chart) => chart.id !== id));
    };
    return (_jsxs("div", { className: "records-page", children: [_jsx("div", { style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem"
                }, children: _jsxs("div", { children: [_jsx("h2", { style: { margin: 0 }, children: "Charts" }), _jsx("div", { style: { opacity: 0.7 }, children: "Build pivot-style charts on the fly without saving to the database." })] }) }), _jsxs("div", { className: "split-grid", children: [_jsxs("aside", { className: "sidebar", children: [_jsx(FilterPanel, { filters: filters, tags: tags, setups: setups, onChange: updateFilters, onReset: () => setFilters({ page: 1, pageSize: 12 }) }), _jsxs("div", { className: "card", children: [_jsx("div", { style: { fontWeight: 600, marginBottom: "0.4rem" }, children: "How it works" }), _jsx("div", { style: { opacity: 0.7, fontSize: "0.95rem", lineHeight: 1.5 }, children: "Adjust filters to scope data, then add table charts with your preferred group (tags, setups, symbols, etc.). Columns can be rearranged via sorting and new chart types can plug into the same config in the future." })] })] }), _jsxs("section", { className: "records-main", children: [_jsx(ChartBuilder, { onAdd: addChart }), _jsx("div", { className: "record-grid", children: chartConfigs.map((chart, idx) => (_jsx(ChartCard, { chart: chart, query: chartQueries[idx], onUpdate: (updater) => updateChart(chart.id, updater), onRemove: () => removeChart(chart.id) }, chart.id))) })] })] })] }));
}
function ChartBuilder({ onAdd }) {
    const [title, setTitle] = useState("Table chart");
    const [groupBy, setGroupBy] = useState("tag");
    const [metrics, setMetrics] = useState([
        "winRate",
        "profitFactor",
        "expectancy"
    ]);
    const toggleMetric = (key) => {
        setMetrics((prev) => prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]);
    };
    return (_jsxs("div", { className: "card", style: { display: "flex", flexDirection: "column", gap: "0.65rem" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700 }, children: "Chart Builder" }), _jsx("div", { style: { opacity: 0.65 }, children: "Add multiple table charts. Trades column is always included." })] }), _jsx("button", { className: "btn", type: "button", onClick: () => onAdd({
                            title: title || "Table chart",
                            type: "table",
                            groupBy,
                            metrics,
                            sortBy: "trades",
                            sortDir: "desc"
                        }), children: "Add chart" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "0.75rem", alignItems: "flex-start" }, children: [_jsxs("label", { children: [_jsx("div", { children: "Title" }), _jsx("input", { className: "input", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "My pivot view" })] }), _jsxs("label", { children: [_jsx("div", { children: "Group by" }), _jsx("select", { className: "select", value: groupBy, onChange: (e) => setGroupBy(e.target.value), children: groupByOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { children: [_jsx("div", { children: "Metrics" }), _jsx("div", { style: {
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.35rem",
                                    marginTop: "0.35rem"
                                }, children: metricOptions.map((opt) => {
                                    const selected = metrics.includes(opt.key);
                                    return (_jsx("button", { type: "button", onClick: () => toggleMetric(opt.key), style: {
                                            padding: "0.35rem 0.6rem",
                                            borderRadius: 999,
                                            border: "1px solid #d5d9e3",
                                            background: selected ? "#0a84ff" : "#fff",
                                            color: selected ? "#fff" : "#0b1d32",
                                            cursor: "pointer"
                                        }, children: opt.label }, opt.key));
                                }) })] })] })] }));
}
function ChartCard({ chart, query, onUpdate, onRemove }) {
    const rows = query.data ?? [];
    const metricKeys = useMemo(() => ["trades", ...chart.metrics], [chart.metrics]);
    const sortedRows = useMemo(() => {
        const list = [...rows];
        const valueFor = (row, key) => key === "label" ? row.label : row[key];
        const compare = (a, b) => {
            const aVal = valueFor(a, chart.sortBy);
            const bVal = valueFor(b, chart.sortBy);
            if (aVal === null || aVal === undefined)
                return 1;
            if (bVal === null || bVal === undefined)
                return -1;
            if (typeof aVal === "string" || typeof bVal === "string") {
                return String(aVal).localeCompare(String(bVal));
            }
            return Number(aVal) - Number(bVal);
        };
        list.sort((a, b) => chart.sortDir === "asc" ? compare(a, b) : compare(b, a));
        return list;
    }, [rows, chart.sortBy, chart.sortDir]);
    const handleToggleMetric = (key) => {
        onUpdate((c) => {
            const nextMetrics = c.metrics.includes(key)
                ? c.metrics.filter((m) => m !== key)
                : [...c.metrics, key];
            const allowedSortKeys = [
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
    const handleSort = (key) => {
        onUpdate((c) => ({
            ...c,
            sortBy: key,
            sortDir: c.sortBy === key && c.sortDir === "desc" ? "asc" : "desc"
        }));
    };
    const groupLabel = groupByOptions.find((g) => g.value === chart.groupBy)?.label ?? chart.groupBy;
    return (_jsxs("div", { className: "card", style: { display: "flex", flexDirection: "column", gap: "0.6rem" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700 }, children: chart.title }), _jsxs("div", { style: { opacity: 0.65 }, children: [groupLabel, " pivot - type: ", chart.type] })] }), _jsx("div", { style: { display: "flex", gap: "0.4rem", alignItems: "center" }, children: _jsx("button", { className: "btn secondary", type: "button", onClick: onRemove, children: "Remove" }) })] }), _jsxs("details", { style: { background: "#f7f8fb", border: "1px solid #e6e9f0", borderRadius: 12, padding: "0.6rem" }, children: [_jsx("summary", { style: { cursor: "pointer", fontWeight: 600, marginBottom: "0.35rem" }, children: "Config" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0.6rem" }, children: [_jsxs("label", { children: [_jsx("div", { children: "Title" }), _jsx("input", { className: "input", value: chart.title, onChange: (e) => onUpdate((c) => ({ ...c, title: e.target.value })) })] }), _jsxs("label", { children: [_jsx("div", { children: "Group by" }), _jsx("select", { className: "select", value: chart.groupBy, onChange: (e) => onUpdate((c) => ({
                                            ...c,
                                            groupBy: e.target.value
                                        })), children: groupByOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("label", { children: [_jsx("div", { children: "Sort by" }), _jsx("select", { className: "select", value: chart.sortBy, onChange: (e) => onUpdate((c) => ({
                                            ...c,
                                            sortBy: e.target.value
                                        })), children: ["label", "trades", ...chart.metrics].map((key) => (_jsx("option", { value: key, children: columnMeta[key]?.label ?? key }, key))) }), _jsx("div", { style: { display: "flex", gap: "0.35rem", marginTop: "0.25rem" }, children: _jsxs("button", { type: "button", className: "btn secondary", onClick: () => onUpdate((c) => ({
                                                ...c,
                                                sortDir: c.sortDir === "asc" ? "desc" : "asc"
                                            })), children: ["Direction: ", chart.sortDir === "asc" ? "Asc" : "Desc"] }) })] }), _jsxs("div", { children: [_jsx("div", { children: "Metrics" }), _jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.25rem" }, children: metricOptions.map((opt) => {
                                            const selected = chart.metrics.includes(opt.key);
                                            return (_jsx("button", { type: "button", onClick: () => handleToggleMetric(opt.key), style: {
                                                    padding: "0.35rem 0.55rem",
                                                    borderRadius: 999,
                                                    border: "1px solid #d5d9e3",
                                                    background: selected ? "#0a84ff" : "#fff",
                                                    color: selected ? "#fff" : "#0b1d32",
                                                    cursor: "pointer"
                                                }, children: opt.label }, opt.key));
                                        }) })] })] })] }), _jsx("div", { style: { overflowX: "auto" }, children: query.isLoading ? (_jsx("div", { children: "Loading..." })) : query.error ? (_jsx("div", { style: { color: "#b91c1c" }, children: "Failed to load chart data" })) : rows.length === 0 ? (_jsx("div", { style: { opacity: 0.7 }, children: "No data for the current filters." })) : (_jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsxs("th", { style: { textAlign: "left", padding: "0.4rem", cursor: "pointer" }, onClick: () => handleSort("label"), children: [groupLabel, " ", chart.sortBy === "label"
                                                ? chart.sortDir === "asc"
                                                    ? "(asc)"
                                                    : "(desc)"
                                                : ""] }), metricKeys.map((key) => (_jsxs("th", { style: { textAlign: "right", padding: "0.4rem", cursor: "pointer" }, onClick: () => handleSort(key), children: [columnMeta[key]?.label ?? key, " ", chart.sortBy === key
                                                ? chart.sortDir === "asc"
                                                    ? "(asc)"
                                                    : "(desc)"
                                                : ""] }, key)))] }) }), _jsx("tbody", { children: sortedRows.map((row) => (_jsxs("tr", { style: { borderTop: "1px solid #e6e9f0" }, children: [_jsx("td", { style: { padding: "0.45rem 0.4rem" }, children: row.label }), metricKeys.map((key) => (_jsx("td", { style: { padding: "0.45rem 0.4rem", textAlign: "right", whiteSpace: "nowrap" }, children: columnMeta[key]?.format(row[key]) ?? "-" }, key)))] }, row.key))) })] })) })] }));
}
function FilterPanel({ filters, tags, setups, onChange, onReset }) {
    const [tagMenuOpen, setTagMenuOpen] = useState(false);
    const selectedTagIds = filters.tagIds ?? [];
    const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));
    const toggleTag = (id) => {
        const current = filters.tagIds ?? [];
        const next = current.includes(id)
            ? current.filter((t) => t !== id)
            : [...current, id];
        onChange({
            ...filters,
            tagIds: next.length ? next : undefined
        });
    };
    return (_jsxs("div", { className: "card", style: { display: "flex", flexDirection: "column", gap: "0.75rem" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700 }, children: "Filters" }), _jsx("div", { style: { opacity: 0.65, fontSize: "0.9rem" }, children: "Applies to all charts" })] }), _jsx("button", { className: "btn secondary", type: "button", onClick: onReset, children: "Reset" })] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "0.65rem" }, children: [_jsxs("label", { children: [_jsx("div", { children: "From" }), _jsx("input", { className: "input", type: "date", value: filters.start ? filters.start.slice(0, 10) : "", onChange: (e) => onChange({
                                    ...filters,
                                    start: e.target.value ? new Date(e.target.value).toISOString() : undefined
                                }) })] }), _jsxs("label", { children: [_jsx("div", { children: "To" }), _jsx("input", { className: "input", type: "date", value: filters.end ? filters.end.slice(0, 10) : "", onChange: (e) => onChange({
                                    ...filters,
                                    end: e.target.value ? new Date(e.target.value).toISOString() : undefined
                                }) })] }), _jsxs("label", { children: [_jsx("div", { children: "Symbol" }), _jsx("input", { className: "input", placeholder: "AAPL", value: filters.symbols?.[0] ?? "", onChange: (e) => onChange({
                                    ...filters,
                                    symbols: e.target.value ? [e.target.value] : undefined
                                }) })] }), _jsxs("label", { children: [_jsx("div", { children: "Account" }), _jsxs("select", { className: "select", value: filters.accountTypes?.[0] ?? "", onChange: (e) => onChange({
                                    ...filters,
                                    accountTypes: e.target.value ? [e.target.value] : undefined
                                }), children: [_jsx("option", { value: "", children: "Any" }), _jsx("option", { value: "live", children: "Live" }), _jsx("option", { value: "sim", children: "Sim" })] })] }), _jsxs("label", { children: [_jsx("div", { children: "Result" }), _jsxs("select", { className: "select", value: filters.results?.[0] ?? "", onChange: (e) => onChange({
                                    ...filters,
                                    results: e.target.value ? [e.target.value] : undefined
                                }), children: [_jsx("option", { value: "", children: "Any" }), _jsx("option", { value: "takeProfit", children: "Take Profit" }), _jsx("option", { value: "stopLoss", children: "Stop Loss" }), _jsx("option", { value: "breakeven", children: "Breakeven" }), _jsx("option", { value: "manualExit", children: "Manual Exit" })] })] }), _jsxs("label", { children: [_jsx("div", { children: "Complied" }), _jsxs("select", { className: "select", value: filters.complied === undefined
                                    ? ""
                                    : filters.complied
                                        ? "yes"
                                        : "no", onChange: (e) => {
                                    const v = e.target.value;
                                    onChange({
                                        ...filters,
                                        complied: v === "" ? undefined : v === "yes"
                                    });
                                }, children: [_jsx("option", { value: "", children: "Any" }), _jsx("option", { value: "yes", children: "Yes" }), _jsx("option", { value: "no", children: "No" })] })] }), _jsxs("label", { children: [_jsx("div", { children: "Setup" }), _jsxs("select", { className: "select", value: filters.setupIds?.[0] ?? "", onChange: (e) => onChange({
                                    ...filters,
                                    setupIds: e.target.value ? [Number(e.target.value)] : undefined
                                }), children: [_jsx("option", { value: "", children: "All" }), setups?.map((setup) => (_jsx("option", { value: setup.id, children: setup.name }, setup.id)))] })] }), _jsxs("label", { children: [_jsx("div", { children: "Tags" }), _jsxs("div", { style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    flexWrap: "wrap"
                                }, children: [_jsx("div", { style: { display: "flex", gap: "0.4rem", flexWrap: "wrap", flex: 1 }, children: selectedTags.length === 0 ? (_jsx("span", { className: "pill", style: { background: "#eef2ff", border: "1px solid #e6e9f0" }, children: "All tags" })) : (selectedTags.map((tag) => (_jsx("span", { className: "pill", style: { background: "#eef2ff", border: "1px solid #e6e9f0" }, children: tag.name }, tag.id)))) }), _jsx("button", { type: "button", className: "btn secondary", style: { padding: "0.35rem 0.6rem" }, onClick: () => setTagMenuOpen((o) => !o), children: tagMenuOpen ? "Close" : "Select" })] }), tagMenuOpen && (_jsxs("div", { className: "card", style: {
                                    marginTop: "0.5rem",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.4rem",
                                    background: "#f7f8fb"
                                }, children: [_jsx("button", { type: "button", className: "btn secondary", style: { padding: "0.35rem 0.6rem" }, onClick: () => {
                                            onChange({ ...filters, tagIds: undefined });
                                            setTagMenuOpen(false);
                                        }, children: "All tags" }), tags?.map((tag) => {
                                        const selected = selectedTagIds.includes(tag.id);
                                        return (_jsx("button", { type: "button", onClick: () => toggleTag(tag.id), style: {
                                                padding: "0.35rem 0.6rem",
                                                borderRadius: "999px",
                                                border: "1px solid #d5d9e3",
                                                background: selected ? "#2563eb" : "#fff",
                                                color: selected ? "#fff" : "#111827",
                                                cursor: "pointer"
                                            }, children: tag.name }, tag.id));
                                    })] }))] })] })] }));
}
