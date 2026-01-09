import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { getAttachmentUrl } from "../api/client";
import { formatDateTime } from "../utils/format";
const resultLabels = {
    takeProfit: "Take Profit",
    stopLoss: "Stop Loss",
    breakeven: "Breakeven",
    manualExit: "Manual Exit"
};
export default function RecordCard({ record, onEdit, onDelete }) {
    const attachment = record.attachments?.[0];
    const preview = attachment ? getAttachmentUrl(attachment.filePath) : null;
    const pnlColor = record.pnl > 0 ? "#10B981" : record.pnl < 0 ? "#EF4444" : "#E5ECFF";
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            if (!menuRef.current)
                return;
            if (!menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);
    return (_jsxs("div", { className: "card", style: {
            padding: "0.95rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
            borderRadius: 16
        }, children: [_jsxs("div", { style: {
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    alignItems: "flex-start"
                }, children: [_jsxs("div", { style: { minWidth: 0 }, children: [_jsx("div", { style: { fontSize: "1.05rem", fontWeight: 700 }, children: record.symbol }), _jsxs("div", { style: { opacity: 0.75, fontSize: "0.9rem" }, children: [formatDateTime(record.datetime), " \u00B7 ", record.accountType] }), _jsxs("div", { style: { display: "flex", gap: "0.35rem", alignItems: "center", marginTop: "0.4rem", flexWrap: "wrap" }, children: [_jsx("span", { className: "pill", style: { background: "rgba(124, 58, 237, 0.15)", color: "#C4B5FD" }, children: resultLabels[record.result] ?? record.result }), _jsxs("span", { className: "pill", style: { background: pnlColor + "20", color: pnlColor }, children: ["PNL ", record.pnl] }), record.complied && (_jsx("span", { className: "pill", style: { background: "rgba(16, 185, 129, 0.15)", color: "#34D399" }, children: "Complied" }))] })] }), _jsxs("div", { style: { position: "relative" }, ref: menuRef, children: [_jsx("button", { className: "menu-button", onClick: (e) => {
                                    e.stopPropagation();
                                    setMenuOpen((v) => !v);
                                }, "aria-label": "Record actions", children: "\u22EF" }), menuOpen && (_jsxs("div", { className: "menu", children: [_jsx("button", { className: "menu-item", onClick: () => {
                                            setMenuOpen(false);
                                            onEdit(record);
                                        }, children: "Edit" }), _jsx("button", { className: "menu-item danger", onClick: () => {
                                            setMenuOpen(false);
                                            onDelete(record.id);
                                        }, children: "Delete" })] }))] })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.4rem" }, children: [_jsx(Metric, { label: "Risk", value: record.riskAmount }), _jsx(Metric, { label: "R Multiple", value: record.rMultiple ?? "-" })] }), record.tags?.length > 0 && (_jsx("div", { style: { display: "flex", gap: "0.35rem", flexWrap: "wrap" }, children: record.tags.map((tag) => (_jsx("span", { className: "tag", children: tag.name }, tag.id))) })), record.notes && (_jsx("p", { style: {
                    margin: 0,
                    opacity: 0.9,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    maxHeight: 120,
                    overflow: "hidden"
                }, children: record.notes })), preview && (_jsx("img", { src: preview, alt: `${record.symbol} attachment`, style: {
                    width: "100%",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                    objectFit: "cover",
                    maxHeight: 240
                } }))] }));
}
function Metric({ label, value }) {
    return (_jsxs("div", { style: {
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 10,
            padding: "0.55rem 0.65rem"
        }, children: [_jsx("div", { style: { opacity: 0.7, fontSize: "0.85rem" }, children: label }), _jsx("div", { style: { fontWeight: 700 }, children: value })] }));
}
