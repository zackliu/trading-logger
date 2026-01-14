import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getAttachmentUrl } from "../api/client";
import { formatDateTime } from "../utils/format";
const resultLabels = {
    takeProfit: "Take Profit",
    stopLoss: "Stop Loss",
    breakeven: "Breakeven",
    manualExit: "Manual Exit"
};
export default function RecordCard({ record, onEdit, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const [lightboxSrc, setLightboxSrc] = useState(null);
    const attachments = useMemo(() => {
        return [...(record.attachments ?? [])].sort((a, b) => {
            if (a.createdAt && b.createdAt)
                return a.createdAt.localeCompare(b.createdAt);
            if (a.id && b.id)
                return a.id - b.id;
            return 0;
        });
    }, [record.attachments]);
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
    const lightbox = lightboxSrc &&
        createPortal(_jsx("div", { onClick: () => setLightboxSrc(null), style: {
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 4000,
                padding: "2.5rem"
            }, children: _jsxs("div", { onClick: (e) => e.stopPropagation(), style: {
                    position: "relative",
                    maxWidth: "min(1600px, 96vw)",
                    maxHeight: "96vh"
                }, children: [_jsx("img", { src: lightboxSrc, alt: "attachment full", style: {
                            maxWidth: "min(1600px, 96vw)",
                            maxHeight: "96vh",
                            borderRadius: 14,
                            objectFit: "contain",
                            boxShadow: "0 36px 90px rgba(0,0,0,0.5)"
                        } }), _jsx("button", { onClick: () => setLightboxSrc(null), style: {
                            position: "absolute",
                            top: -14,
                            right: -14,
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(0,0,0,0.82)",
                            color: "white",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            boxShadow: "0 12px 34px rgba(0,0,0,0.35)"
                        }, "aria-label": "Close image", children: "\u00D7" })] }) }), document.body);
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
                }, children: [_jsxs("div", { style: { minWidth: 0 }, children: [_jsx("div", { style: { fontSize: "1.05rem", fontWeight: 700 }, children: record.setup?.name ?? "Unknown" }), _jsxs("div", { style: { opacity: 0.75, fontSize: "0.9rem" }, children: [record.symbol, " \u00B7 ", formatDateTime(record.datetime), " \u00B7 ", record.accountType] }), _jsxs("div", { style: { display: "flex", gap: "0.35rem", alignItems: "center", marginTop: "0.4rem", flexWrap: "wrap" }, children: [_jsx("span", { className: "pill", style: { background: "rgba(124, 58, 237, 0.15)", color: "#C4B5FD" }, children: resultLabels[record.result] ?? record.result }), record.tags?.map((tag) => (_jsx("span", { className: "pill", style: {
                                            background: tag.color ?? "rgba(0,0,0,0.06)",
                                            color: tag.color ? "#0b1d32" : "#0b1d32"
                                        }, children: tag.name }, tag.id))), record.complied && (_jsx("span", { className: "pill", style: { background: "rgba(16, 185, 129, 0.15)", color: "#34D399" }, children: "Complied" }))] })] }), _jsxs("div", { style: { position: "relative" }, ref: menuRef, children: [_jsx("button", { className: "menu-button", onClick: (e) => {
                                    e.stopPropagation();
                                    setMenuOpen((v) => !v);
                                }, "aria-label": "Record actions", children: "\u22EF" }), menuOpen && (_jsxs("div", { className: "menu", children: [_jsx("button", { className: "menu-item", onClick: () => {
                                            setMenuOpen(false);
                                            onEdit(record);
                                        }, children: "Edit" }), _jsx("button", { className: "menu-item danger", onClick: () => {
                                            setMenuOpen(false);
                                            onDelete(record.id);
                                        }, children: "Delete" })] }))] })] }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.4rem" }, children: _jsx(Metric, { label: "R Multiple", value: record.rMultiple ?? "-" }) }), record.notes && (_jsx("p", { style: {
                    margin: 0,
                    opacity: 0.9,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    maxHeight: 120,
                    overflow: "hidden"
                }, children: record.notes })), attachments.length > 0 && (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem" }, children: attachments.map((att) => {
                    const src = getAttachmentUrl(att.filePath);
                    return (_jsx("div", { style: { position: "relative" }, children: _jsx("img", { src: src, alt: "attachment", onClick: () => setLightboxSrc(src), style: {
                                width: "100%",
                                height: "auto",
                                borderRadius: 12,
                                border: "1px solid #e6e9f0",
                                cursor: "zoom-in",
                                background: "#f7f8fb",
                                objectFit: "contain"
                            } }) }, att.id));
                }) })), lightbox] }));
}
function Metric({ label, value }) {
    return (_jsxs("div", { style: {
            background: "#f7f8fb",
            border: "1px solid #e6e9f0",
            borderRadius: 10,
            padding: "0.55rem 0.65rem"
        }, children: [_jsx("div", { style: { opacity: 0.7, fontSize: "0.85rem" }, children: label }), _jsx("div", { style: { fontWeight: 700 }, children: value })] }));
}
