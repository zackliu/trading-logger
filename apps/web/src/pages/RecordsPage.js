import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import RecordForm from "../components/RecordForm";
import RecordCard from "../components/RecordCard";
export default function RecordsPage() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({
        page: 1,
        pageSize: 12
    });
    const [formMode, setFormMode] = useState(null);
    const [editing, setEditing] = useState(null);
    const { data: tags = [] } = useQuery({
        queryKey: ["tags"],
        queryFn: api.listTags
    });
    const { data: customFields = [] } = useQuery({
        queryKey: ["customFields"],
        queryFn: api.listCustomFields
    });
    const recordQuery = useQuery({
        queryKey: ["records", filters],
        queryFn: () => api.getRecords(filters)
    });
    const summaryQuery = useQuery({
        queryKey: ["analytics", "summary", filters],
        queryFn: () => api.analyticsSummary(filters)
    });
    const tagBreakdown = useQuery({
        queryKey: ["analytics", "tag", filters],
        queryFn: () => api.analyticsGroupBy(filters, "tag")
    });
    const resultBreakdown = useQuery({
        queryKey: ["analytics", "result", filters],
        queryFn: () => api.analyticsGroupBy(filters, "result")
    });
    const createMutation = useMutation({
        mutationFn: (payload) => api.createRecord(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["records"] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }
    });
    const updateMutation = useMutation({
        mutationFn: (payload) => api.updateRecord(payload.id, payload.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["records"] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }
    });
    const deleteMutation = useMutation({
        mutationFn: (ids) => api.deleteRecords(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["records"] });
            queryClient.invalidateQueries({ queryKey: ["analytics"] });
        }
    });
    const handleSave = async (payload) => {
        if (formMode === "edit" && editing?.id) {
            const updatePayload = { ...payload, id: editing.id };
            await updateMutation.mutateAsync({
                id: editing.id,
                data: updatePayload
            });
        }
        else {
            await createMutation.mutateAsync(payload);
        }
        setFormMode(null);
        setEditing(null);
    };
    const handleDelete = async (id) => {
        await deleteMutation.mutateAsync([id]);
        if (editing?.id === id) {
            setFormMode(null);
            setEditing(null);
        }
    };
    const records = recordQuery.data?.items ?? [];
    const total = recordQuery.data?.total ?? 0;
    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / (filters.pageSize ?? 12))), [total, filters.pageSize]);
    const startNew = () => {
        setFormMode("create");
        setEditing(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const startEdit = (record) => {
        setEditing(record);
        setFormMode("edit");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const updateFilters = (next) => setFilters((f) => ({ ...f, ...next, page: 1 }));
    return (_jsxs("div", { className: "records-page", children: [_jsxs("div", { style: {
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    alignItems: "center",
                    marginBottom: "0.75rem"
                }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0 }, children: "Records & Analysis" }), _jsx("div", { style: { opacity: 0.7, fontSize: "0.9rem" }, children: "Filter trades, review stats, and edit records in one view." })] }), _jsx("button", { className: "btn", onClick: startNew, children: "New Record" })] }), _jsxs("div", { className: "split-grid", children: [_jsxs("aside", { className: "sidebar", children: [_jsx(FilterPanel, { filters: filters, tags: tags, onChange: updateFilters, onReset: () => setFilters({ page: 1, pageSize: 12 }) }), _jsx(AnalyticsPanel, { summary: summaryQuery.data, loading: summaryQuery.isLoading, tagRows: tagBreakdown.data ?? [], resultRows: resultBreakdown.data ?? [] })] }), _jsxs("section", { className: "records-main", children: [formMode && (_jsx(RecordForm, { initial: formMode === "edit" ? editing : null, tags: tags, customFields: customFields, onSaved: handleSave, onCancel: () => {
                                    setFormMode(null);
                                    setEditing(null);
                                } }, formMode === "edit" ? editing?.id ?? "edit" : "create")), _jsx("div", { className: "record-grid", children: records.map((record) => (_jsx(RecordCard, { record: record, onEdit: startEdit, onDelete: handleDelete }, record.id))) }), records.length === 0 && (_jsx("div", { className: "card", style: { textAlign: "center", padding: "1.5rem" }, children: "No records match the current filters." })), _jsxs("div", { style: {
                                    display: "flex",
                                    gap: "0.5rem",
                                    alignItems: "center",
                                    justifyContent: "flex-end"
                                }, children: [_jsxs("span", { style: { opacity: 0.75 }, children: ["Page ", filters.page, " / ", totalPages] }), _jsx("button", { className: "btn secondary", disabled: filters.page === 1, onClick: () => setFilters((f) => ({
                                            ...f,
                                            page: Math.max(1, (f.page ?? 1) - 1)
                                        })), children: "Prev" }), _jsx("button", { className: "btn secondary", disabled: filters.page === totalPages, onClick: () => setFilters((f) => ({
                                            ...f,
                                            page: Math.min(totalPages, (f.page ?? 1) + 1)
                                        })), children: "Next" })] })] })] })] }));
}
function FilterPanel({ filters, tags, onChange, onReset }) {
    return (_jsxs("div", { className: "card", style: { display: "flex", flexDirection: "column", gap: "0.75rem" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700 }, children: "Filters" }), _jsx("div", { style: { opacity: 0.65, fontSize: "0.9rem" }, children: "Narrow records and analytics" })] }), _jsx("button", { className: "btn secondary", type: "button", onClick: onReset, children: "Reset" })] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "0.65rem" }, children: [_jsxs("label", { children: [_jsx("div", { children: "From" }), _jsx("input", { className: "input", type: "date", value: filters.start ? filters.start.slice(0, 10) : "", onChange: (e) => onChange({
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
                                }, children: [_jsx("option", { value: "", children: "Any" }), _jsx("option", { value: "yes", children: "Yes" }), _jsx("option", { value: "no", children: "No" })] })] }), _jsxs("label", { children: [_jsx("div", { children: "Tags" }), _jsxs("select", { className: "select", value: filters.tagIds?.[0] ?? "", onChange: (e) => onChange({
                                    ...filters,
                                    tagIds: e.target.value ? [Number(e.target.value)] : undefined
                                }), children: [_jsx("option", { value: "", children: "All" }), tags?.map((tag) => (_jsx("option", { value: tag.id, children: tag.name }, tag.id)))] })] })] })] }));
}
function AnalyticsPanel({ summary, loading, tagRows, resultRows }) {
    return (_jsxs("div", { className: "card", style: { display: "flex", flexDirection: "column", gap: "0.75rem" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700 }, children: "Analysis" }), _jsx("div", { style: { opacity: 0.65, fontSize: "0.9rem" }, children: "Updates instantly with filters" })] }), loading && _jsx("div", { children: "Loading..." }), summary && (_jsxs("div", { className: "analytics-grid", children: [_jsx(Stat, { label: "Trades", value: summary.totalTrades }), _jsx(Stat, { label: "Win Rate", value: `${(summary.winRate * 100).toFixed(1)}%` }), _jsx(Stat, { label: "Profit Factor", value: summary.profitFactor }), _jsx(Stat, { label: "Expectancy (R)", value: summary.expectancy }), _jsx(Stat, { label: "Avg R", value: summary.avgR }), _jsx(Stat, { label: "Avg Win R", value: summary.avgWinR }), _jsx(Stat, { label: "Avg Loss R", value: summary.avgLossR }), _jsx(Stat, { label: "Payoff Ratio", value: summary.payoffRatio })] })), _jsx(Breakdown, { title: "By Result", rows: resultRows }), _jsx(Breakdown, { title: "Top Tags", rows: tagRows })] }));
}
function Stat({ label, value }) {
    const formatValue = (v) => {
        if (v === null || v === undefined)
            return "-";
        if (typeof v === "number" && Number.isFinite(v))
            return v.toFixed(2);
        return v;
    };
    return (_jsxs("div", { style: {
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: "0.7rem 0.8rem"
        }, children: [_jsx("div", { style: { opacity: 0.7, fontSize: "0.9rem" }, children: label }), _jsx("div", { style: { fontWeight: 700 }, children: formatValue(value) })] }));
}
function Breakdown({ title, rows }) {
    const top = rows.slice(0, 4);
    return (_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600, marginBottom: "0.35rem" }, children: title }), top.length === 0 ? (_jsx("div", { style: { opacity: 0.65 }, children: "No data" })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.35rem" }, children: top.map((row) => (_jsxs("div", { style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.45rem 0.55rem",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)"
                    }, children: [_jsxs("div", { style: { display: "flex", gap: "0.45rem", alignItems: "center" }, children: [_jsx("span", { className: "pill", children: row.label }), _jsxs("span", { style: { opacity: 0.75 }, children: [row.trades, " trades"] })] }), _jsx("div", { style: { fontWeight: 700 }, children: row.winRate ? `${(row.winRate * 100).toFixed(0)}%` : "-" })] }, row.key))) }))] }));
}
