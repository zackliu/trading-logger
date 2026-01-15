import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api, getAttachmentUrl } from "../api/client";
import { formatDateTime } from "../utils/format";
const parseFilters = (params) => {
    const tagIds = params.getAll("tagIds").map((t) => Number(t)).filter(Boolean);
    const setupIds = params.getAll("setupIds").map((t) => Number(t)).filter(Boolean);
    const accountTypes = params.getAll("accountTypes");
    const results = params.getAll("results");
    const symbols = params.getAll("symbols");
    const compliedRaw = params.get("complied");
    const customFieldFilters = params.get("cff")
        ? JSON.parse(params.get("cff") || "[]")
        : undefined;
    return {
        start: params.get("start") || undefined,
        end: params.get("end") || undefined,
        tagIds: tagIds.length ? tagIds : undefined,
        setupIds: setupIds.length ? setupIds : undefined,
        accountTypes: accountTypes.length ? accountTypes : undefined,
        results: results.length ? results : undefined,
        symbols: symbols.length ? symbols : undefined,
        complied: compliedRaw === undefined || compliedRaw === null || compliedRaw === ""
            ? undefined
            : compliedRaw === "true",
        customFieldFilters
    };
};
const toParams = (filters) => {
    const params = new URLSearchParams();
    if (filters.start)
        params.set("start", filters.start);
    if (filters.end)
        params.set("end", filters.end);
    filters.tagIds?.forEach((t) => params.append("tagIds", String(t)));
    filters.setupIds?.forEach((s) => params.append("setupIds", String(s)));
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
    const filters = useMemo(() => parseFilters(searchParams), [searchParams.toString()]);
    const [customFieldGroup, setCustomFieldGroup] = useState(null);
    const { data: tags = [] } = useQuery({
        queryKey: ["tags"],
        queryFn: api.listTags
    });
    const { data: setups = [] } = useQuery({
        queryKey: ["setups"],
        queryFn: api.listSetups
    });
    const { data: customFields = [] } = useQuery({
        queryKey: ["customFields"],
        queryFn: api.listCustomFields
    });
    const summaryQuery = useQuery({
        queryKey: ["analytics", "summary", filters],
        queryFn: () => api.analyticsSummary(filters)
    });
    const tagBreakdown = useQuery({
        queryKey: ["analytics", "tag", filters],
        queryFn: () => api.analyticsGroupBy(filters, "tag")
    });
    const setupBreakdown = useQuery({
        queryKey: ["analytics", "setup", filters],
        queryFn: () => api.analyticsGroupBy(filters, "setup")
    });
    const symbolBreakdown = useQuery({
        queryKey: ["analytics", "symbol", filters],
        queryFn: () => api.analyticsGroupBy(filters, "symbol")
    });
    const compliedBreakdown = useQuery({
        queryKey: ["analytics", "complied", filters],
        queryFn: () => api.analyticsGroupBy(filters, "complied")
    });
    const accountBreakdown = useQuery({
        queryKey: ["analytics", "accountType", filters],
        queryFn: () => api.analyticsGroupBy(filters, "accountType")
    });
    const customBreakdown = useQuery({
        queryKey: ["analytics", "custom", customFieldGroup, filters],
        queryFn: () => customFieldGroup
            ? api.analyticsGroupBy(filters, `customField:${customFieldGroup}`)
            : Promise.resolve([]),
        enabled: !!customFieldGroup
    });
    const recordsQuery = useQuery({
        queryKey: ["records", "analysis", filters],
        queryFn: () => api.getRecords({ ...filters, page: 1, pageSize: 12 })
    });
    const updateFilters = (next) => {
        const params = toParams(next);
        setSearchParams(params);
    };
    const addCustomFilter = (field, value, extra) => {
        const current = filters.customFieldFilters ?? [];
        let newFilter;
        switch (field.type) {
            case "number":
                newFilter = {
                    fieldId: field.id,
                    type: "number",
                    min: extra?.min,
                    max: extra?.max
                };
                break;
            case "boolean":
                newFilter = { fieldId: field.id, type: "boolean", value: Boolean(value) };
                break;
            case "singleSelect":
                newFilter = {
                    fieldId: field.id,
                    type: "singleSelect",
                    values: [value]
                };
                break;
            case "multiSelect":
                newFilter = {
                    fieldId: field.id,
                    type: "multiSelect",
                    values: Array.isArray(value) ? value : []
                };
                break;
            case "date":
            case "datetime":
                newFilter = {
                    fieldId: field.id,
                    type: field.type,
                    start: extra?.start,
                    end: extra?.end
                };
                break;
            default:
                newFilter = {
                    fieldId: field.id,
                    type: field.type,
                    value: value
                };
        }
        updateFilters({
            ...filters,
            customFieldFilters: [...current, newFilter]
        });
    };
    const removeCustomFilter = (index) => {
        const next = [...(filters.customFieldFilters ?? [])];
        next.splice(index, 1);
        updateFilters({
            ...filters,
            customFieldFilters: next
        });
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0 }, children: "Analysis" }), _jsx("div", { style: { opacity: 0.7 }, children: "Filter by time, setup, symbol, tags, and custom dimensions." })] }), _jsx("button", { className: "btn secondary", onClick: () => setSearchParams(new URLSearchParams()), children: "Reset filters" })] }), _jsx(FilterPanel, { filters: filters, tags: tags?.map((t) => ({ id: t.id, label: t.name })) ?? [], setups: setups?.map((s) => ({ id: s.id, label: s.name })) ?? [], onChange: (next) => updateFilters({ ...filters, ...next }) }), customFields && customFields.length > 0 && (_jsx(CustomFilterBuilder, { fields: customFields, onAdd: addCustomFilter, activeFilters: filters.customFieldFilters ?? [], onRemove: removeCustomFilter })), _jsx("div", { style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "0.75rem",
                    margin: "1rem 0"
                }, children: summaryQuery.data ? (_jsxs(_Fragment, { children: [_jsx(StatCard, { label: "Total", value: summaryQuery.data.totalTrades }), _jsx(StatCard, { label: "Win Rate", value: `${(summaryQuery.data.winRate * 100).toFixed(1)}%` }), _jsx(StatCard, { label: ">= 1R Rate", value: `${(summaryQuery.data.gte1RRate * 100).toFixed(1)}%` }), _jsx(StatCard, { label: "<= -1R Rate", value: `${(summaryQuery.data.lteNeg1RRate * 100).toFixed(1)}%` }), _jsx(StatCard, { label: "Profit Factor", value: summaryQuery.data.profitFactor ?? 0 }), _jsx(StatCard, { label: "Expectancy (R)", value: summaryQuery.data.expectancy ?? null }), _jsx(StatCard, { label: "Avg R", value: summaryQuery.data.avgR ?? null }), _jsx(StatCard, { label: "Avg Win R", value: summaryQuery.data.avgWinR ?? null }), _jsx(StatCard, { label: "Avg Loss R", value: summaryQuery.data.avgLossR ?? null }), _jsx(StatCard, { label: "Payoff Ratio", value: summaryQuery.data.payoffRatio ?? null })] })) : (_jsx("div", { children: "Loading..." })) }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }, children: [_jsx(BreakdownTable, { title: "By Setup", data: setupBreakdown.data ?? [] }), _jsx(BreakdownTable, { title: "By Tag", data: tagBreakdown.data ?? [] }), _jsx(BreakdownTable, { title: "By Symbol", data: symbolBreakdown.data ?? [] }), _jsx(BreakdownTable, { title: "By Complied", data: compliedBreakdown.data ?? [] }), _jsx(BreakdownTable, { title: "By Account", data: accountBreakdown.data ?? [] }), _jsxs("div", { className: "card", children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("h3", { style: { margin: 0 }, children: "Custom Group" }), _jsxs("select", { className: "select", value: customFieldGroup ?? "", onChange: (e) => setCustomFieldGroup(e.target.value || null), children: [_jsx("option", { value: "", children: "Select field" }), customFields?.map((f) => (_jsx("option", { value: f.id, children: f.label }, f.id)))] })] }), customBreakdown.data && customBreakdown.data.length > 0 ? (_jsxs("table", { style: { width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Value" }), _jsx("th", { children: "Trades" }), _jsx("th", { children: "Win%" }), _jsx("th", { children: "PF" }), _jsx("th", { children: "Expectancy" })] }) }), _jsx("tbody", { children: customBreakdown.data.map((row) => (_jsxs("tr", { style: { borderTop: "1px solid #e6e9f0" }, children: [_jsx("td", { children: row.label }), _jsx("td", { children: row.trades }), _jsx("td", { children: row.winRate ? (row.winRate * 100).toFixed(1) + "%" : "-" }), _jsx("td", { children: row.profitFactor?.toFixed(2) ?? "-" }), _jsx("td", { children: row.expectancy?.toFixed(2) ?? "-" })] }, row.key))) })] })) : (_jsx("div", { style: { marginTop: "0.5rem", opacity: 0.8 }, children: "Select a field to pivot." }))] })] }), _jsxs("div", { style: { marginTop: "1rem" }, children: [_jsx("h3", { children: "Records Browser" }), _jsx("div", { className: "card", style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "0.75rem" }, children: recordsQuery.data?.items.map((r) => (_jsxs("div", { style: { border: "1px solid #e6e9f0", borderRadius: 10, padding: "0.6rem", background: "#f7f8fb" }, children: [_jsx("div", { style: { fontWeight: 600 }, children: r.setup?.name ?? "Unknown" }), _jsxs("div", { style: { opacity: 0.7, fontSize: "0.9rem" }, children: [r.symbol, " \u00B7 ", formatDateTime(r.datetime)] }), _jsxs("div", { style: { fontWeight: 600 }, children: ["R: ", r.rMultiple ?? "-"] }), _jsx("div", { style: { display: "flex", gap: "0.25rem", flexWrap: "wrap" }, children: r.tags.map((t) => (_jsx("span", { className: "tag", children: t.name }, t.id))) }), r.attachments[0] && (_jsx("img", { src: getAttachmentUrl(r.attachments[0].filePath), alt: "thumb", style: { width: "100%", borderRadius: 8, marginTop: "0.35rem" } }))] }, r.id))) })] })] }));
}
function FilterPanel({ filters, tags, setups, onChange }) {
    const [tagMenuOpen, setTagMenuOpen] = useState(false);
    const selectedTagIds = filters.tagIds ?? [];
    const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));
    const toggleTag = (id) => {
        const current = filters.tagIds ?? [];
        const next = current.includes(id) ? current.filter((t) => t !== id) : [...current, id];
        onChange({
            ...filters,
            tagIds: next.length ? next : undefined
        });
    };
    return (_jsx("div", { className: "card", style: { margin: "1rem 0" }, children: _jsxs("div", { style: { display: "flex", gap: "0.75rem", flexWrap: "wrap" }, children: [_jsxs("label", { children: [_jsx("div", { children: "From" }), _jsx("input", { className: "input", type: "date", value: filters.start ? filters.start.slice(0, 10) : "", onChange: (e) => onChange({
                                ...filters,
                                start: e.target.value ? new Date(e.target.value).toISOString() : undefined
                            }) })] }), _jsxs("label", { children: [_jsx("div", { children: "To" }), _jsx("input", { className: "input", type: "date", value: filters.end ? filters.end.slice(0, 10) : "", onChange: (e) => onChange({
                                ...filters,
                                end: e.target.value ? new Date(e.target.value).toISOString() : undefined
                            }) })] }), _jsxs("label", { children: [_jsx("div", { children: "Symbols" }), _jsx("input", { className: "input", placeholder: "Comma separated", value: filters.symbols?.join(",") ?? "", onChange: (e) => onChange({
                                ...filters,
                                symbols: e.target.value
                                    ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                                    : undefined
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
                            }), children: [_jsx("option", { value: "", children: "Any" }), setups.map((s) => (_jsx("option", { value: s.id, children: s.label }, s.id)))] })] }), _jsxs("label", { children: [_jsx("div", { children: "Tags" }), _jsxs("div", { style: {
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                flexWrap: "wrap"
                            }, children: [_jsx("div", { style: { display: "flex", gap: "0.4rem", flexWrap: "wrap", flex: 1 }, children: selectedTags.length === 0 ? (_jsx("span", { className: "pill", style: { background: "#eef2ff", border: "1px solid #e6e9f0" }, children: "All tags" })) : (selectedTags.map((tag) => (_jsx("span", { className: "pill", style: { background: "#eef2ff", border: "1px solid #e6e9f0" }, children: tag.label }, tag.id)))) }), _jsx("button", { type: "button", className: "btn secondary", style: { padding: "0.35rem 0.6rem" }, onClick: () => setTagMenuOpen((o) => !o), children: tagMenuOpen ? "Close" : "Select" })] }), tagMenuOpen && (_jsxs("div", { className: "card", style: {
                                marginTop: "0.5rem",
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "0.4rem",
                                background: "#f7f8fb"
                            }, children: [_jsx("button", { type: "button", className: "btn secondary", style: { padding: "0.35rem 0.6rem" }, onClick: () => {
                                        onChange({ ...filters, tagIds: undefined });
                                        setTagMenuOpen(false);
                                    }, children: "All tags" }), tags.map((tag) => {
                                    const selected = selectedTagIds.includes(tag.id);
                                    return (_jsx("button", { type: "button", onClick: () => toggleTag(tag.id), style: {
                                            padding: "0.35rem 0.6rem",
                                            borderRadius: "999px",
                                            border: "1px solid #d5d9e3",
                                            background: selected ? "#2563eb" : "#fff",
                                            color: selected ? "#fff" : "#111827",
                                            cursor: "pointer"
                                        }, children: tag.label }, tag.id));
                                })] }))] })] }) }));
}
function StatCard({ label, value }) {
    const formatValue = (v) => {
        if (v === null || v === undefined)
            return "-";
        if (typeof v === "number" && Number.isFinite(v))
            return v.toFixed(2);
        return v;
    };
    return (_jsxs("div", { className: "card", children: [_jsx("div", { style: { opacity: 0.7, fontSize: "0.9rem" }, children: label }), _jsx("div", { style: { fontSize: "1.4rem", fontWeight: 700 }, children: formatValue(value) })] }));
}
function BreakdownTable({ title, data }) {
    const formatWinRate = (v) => v === null || v === undefined ? "-" : `${(v * 100).toFixed(1)}%`;
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { style: { marginTop: 0 }, children: title }), _jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Key" }), _jsx("th", { children: "Trades" }), _jsx("th", { children: "Win%" }), _jsx("th", { children: "PF" }), _jsx("th", { children: "Expectancy" })] }) }), _jsx("tbody", { children: data.map((row) => (_jsxs("tr", { style: { borderTop: "1px solid #e6e9f0" }, children: [_jsx("td", { children: row.label }), _jsx("td", { children: row.trades }), _jsx("td", { children: formatWinRate(row.winRate) }), _jsx("td", { children: row.profitFactor?.toFixed(2) ?? "-" }), _jsx("td", { children: row.expectancy?.toFixed(2) ?? "-" })] }, row.key))) })] })] }));
}
function CustomFilterBuilder({ fields, onAdd, activeFilters, onRemove }) {
    const [fieldId, setFieldId] = useState(null);
    const selectedField = fields.find((f) => f.id === fieldId) ?? null;
    const [textValue, setTextValue] = useState("");
    const [numberMin, setNumberMin] = useState("");
    const [numberMax, setNumberMax] = useState("");
    const [boolValue, setBoolValue] = useState("true");
    const [selectValues, setSelectValues] = useState([]);
    const [dateRange, setDateRange] = useState({});
    return (_jsxs("div", { className: "card", style: { marginBottom: "1rem" }, children: [_jsxs("div", { style: { display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }, children: [_jsxs("label", { children: [_jsx("div", { children: "Custom Field" }), _jsxs("select", { className: "select", value: fieldId ?? "", onChange: (e) => setFieldId(e.target.value ? Number(e.target.value) : null), children: [_jsx("option", { value: "", children: "Select" }), fields.map((f) => (_jsx("option", { value: f.id, children: f.label }, f.id)))] })] }), selectedField && renderValueInput(), _jsx("button", { className: "btn secondary", disabled: !selectedField, onClick: () => {
                            if (!selectedField)
                                return;
                            if (selectedField.type === "number") {
                                onAdd(selectedField, 0, {
                                    min: numberMin ? Number(numberMin) : undefined,
                                    max: numberMax ? Number(numberMax) : undefined
                                });
                            }
                            else if (selectedField.type === "boolean") {
                                onAdd(selectedField, boolValue === "true");
                            }
                            else if (selectedField.type === "multiSelect") {
                                onAdd(selectedField, selectValues);
                            }
                            else if (selectedField.type === "singleSelect") {
                                onAdd(selectedField, selectValues[0] ?? "");
                            }
                            else if (selectedField.type === "date" || selectedField.type === "datetime") {
                                onAdd(selectedField, "", {
                                    start: dateRange.start,
                                    end: dateRange.end
                                });
                            }
                            else {
                                onAdd(selectedField, textValue);
                            }
                        }, children: "Add Filter" })] }), activeFilters.length > 0 && (_jsx("div", { style: { marginTop: "0.5rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }, children: activeFilters.map((f, idx) => (_jsxs("span", { className: "tag", children: [fields.find((fi) => fi.id === f.fieldId)?.label, ":", " ", f.type === "number"
                            ? `${f.min ?? ""} - ${f.max ?? ""}`
                            : f.type === "date" || f.type === "datetime"
                                ? `${f.start ?? ""} → ${f.end ?? ""}`
                                : "value" in f
                                    ? f.value ?? ""
                                    : f.values?.join(","), _jsx("button", { style: {
                                marginLeft: "0.35rem",
                                background: "transparent",
                                border: "none",
                                color: "#9CA3AF",
                                cursor: "pointer"
                            }, onClick: () => onRemove(idx), children: "\u00D7" })] }, idx))) }))] }));
    function renderValueInput() {
        if (!selectedField)
            return null;
        if (selectedField.type === "number") {
            return (_jsxs(_Fragment, { children: [_jsxs("label", { children: [_jsx("div", { children: "Min" }), _jsx("input", { className: "input", type: "number", value: numberMin, onChange: (e) => setNumberMin(e.target.value) })] }), _jsxs("label", { children: [_jsx("div", { children: "Max" }), _jsx("input", { className: "input", type: "number", value: numberMax, onChange: (e) => setNumberMax(e.target.value) })] })] }));
        }
        if (selectedField.type === "boolean") {
            return (_jsxs("label", { children: [_jsx("div", { children: "Value" }), _jsxs("select", { className: "select", value: boolValue, onChange: (e) => setBoolValue(e.target.value), children: [_jsx("option", { value: "true", children: "True" }), _jsx("option", { value: "false", children: "False" })] })] }));
        }
        if (selectedField.type === "singleSelect" || selectedField.type === "multiSelect") {
            return (_jsxs("label", { children: [_jsx("div", { children: "Options" }), _jsx("div", { style: { display: "flex", gap: "0.35rem", flexWrap: "wrap" }, children: selectedField.options?.map((opt) => (_jsxs("label", { children: [_jsx("input", { type: selectedField.type === "singleSelect" ? "radio" : "checkbox", name: "cf-options", checked: selectedField.type === "singleSelect"
                                        ? selectValues[0] === opt.value
                                        : selectValues.includes(opt.value), onChange: (e) => {
                                        if (selectedField.type === "singleSelect") {
                                            setSelectValues([opt.value]);
                                        }
                                        else {
                                            setSelectValues((prev) => e.target.checked
                                                ? [...prev, opt.value]
                                                : prev.filter((v) => v !== opt.value));
                                        }
                                    } }), opt.label] }, opt.value))) })] }));
        }
        if (selectedField.type === "date" || selectedField.type === "datetime") {
            return (_jsxs(_Fragment, { children: [_jsxs("label", { children: [_jsx("div", { children: "Start" }), _jsx("input", { className: "input", type: selectedField.type === "date" ? "date" : "datetime-local", value: dateRange.start ?? "", onChange: (e) => setDateRange((d) => ({
                                    ...d,
                                    start: e.target.value
                                        ? selectedField.type === "date"
                                            ? e.target.value
                                            : new Date(e.target.value).toISOString()
                                        : undefined
                                })) })] }), _jsxs("label", { children: [_jsx("div", { children: "End" }), _jsx("input", { className: "input", type: selectedField.type === "date" ? "date" : "datetime-local", value: dateRange.end ?? "", onChange: (e) => setDateRange((d) => ({
                                    ...d,
                                    end: e.target.value
                                        ? selectedField.type === "date"
                                            ? e.target.value
                                            : new Date(e.target.value).toISOString()
                                        : undefined
                                })) })] })] }));
        }
        return (_jsxs("label", { style: { flex: "1 1 240px" }, children: [_jsx("div", { children: "Value" }), _jsx("input", { className: "input", value: textValue, onChange: (e) => setTextValue(e.target.value) })] }));
    }
}
