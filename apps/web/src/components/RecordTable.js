import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatDateTime } from "../utils/format";
const badge = (label, tone) => (_jsx("span", { style: {
        padding: "0.2rem 0.55rem",
        borderRadius: 999,
        fontSize: "0.8rem",
        background: tone
    }, children: label }));
export default function RecordTable({ records, selectedIds, onToggleSelect, onSelectAll, onOpen }) {
    return (_jsx("div", { className: "card", style: { overflowX: "auto" }, children: _jsxs("table", { style: { width: "100%", borderCollapse: "collapse" }, children: [_jsx("thead", { children: _jsxs("tr", { style: { textAlign: "left", fontSize: "0.9rem" }, children: [_jsx("th", { children: _jsx("input", { type: "checkbox", checked: selectedIds.length === records.length && records.length > 0, onChange: onSelectAll }) }), _jsx("th", { children: "Date" }), _jsx("th", { children: "Symbol" }), _jsx("th", { children: "Account" }), _jsx("th", { children: "Result" }), _jsx("th", { children: "R" }), _jsx("th", { children: "Complied" }), _jsx("th", { children: "Tags" }), _jsx("th", { children: "Notes" })] }) }), _jsx("tbody", { children: records.map((r) => (_jsxs("tr", { style: {
                            borderTop: "1px solid rgba(255,255,255,0.06)",
                            cursor: "pointer"
                        }, onClick: () => onOpen(r.id), children: [_jsx("td", { children: _jsx("input", { type: "checkbox", checked: selectedIds.includes(r.id), onChange: (e) => {
                                        e.stopPropagation();
                                        onToggleSelect(r.id);
                                    } }) }), _jsx("td", { children: formatDateTime(r.datetime) }), _jsx("td", { children: r.symbol }), _jsx("td", { children: r.accountType }), _jsx("td", { children: r.result }), _jsx("td", { children: r.rMultiple ?? "-" }), _jsx("td", { children: badge(r.complied ? "Yes" : "No", r.complied ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)") }), _jsx("td", { children: _jsx("div", { style: { display: "flex", gap: "0.25rem", flexWrap: "wrap" }, children: r.tags.map((t) => (_jsx("span", { className: "tag", children: t.name }, t.id))) }) }), _jsx("td", { style: { maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: r.notes })] }, r.id))) })] }) }));
}
