import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { api, getAttachmentUrl } from "../api/client";
import { toInputDateTime, toIsoFromLocal } from "../utils/format";
const defaultState = () => ({
    datetime: new Date().toISOString(),
    symbol: "",
    accountType: "sim",
    result: "takeProfit",
    pnl: 0,
    riskAmount: 0,
    rMultiple: null,
    complied: false,
    notes: "",
    tagIds: [],
    customValues: [],
    attachmentIds: []
});
export default function RecordForm({ initial, tags, customFields, onSaved, onCancel }) {
    const [state, setState] = useState(() => initial
        ? {
            datetime: initial.datetime,
            symbol: initial.symbol,
            accountType: initial.accountType,
            result: initial.result,
            pnl: initial.pnl,
            riskAmount: initial.riskAmount,
            rMultiple: initial.rMultiple ?? null,
            complied: initial.complied,
            notes: initial.notes ?? "",
            tagIds: initial.tags.map((t) => t.id) ?? [],
            customValues: [],
            attachmentIds: initial.attachments.map((a) => a.id).filter(Boolean)
        }
        : defaultState());
    const [customValueMap, setCustomValueMap] = useState(() => {
        const map = {};
        initial?.customValues.forEach((cv) => {
            map[cv.fieldId] = cv;
        });
        return map;
    });
    const [uploading, setUploading] = useState(false);
    const [attachmentPreview, setAttachmentPreview] = useState(initial?.attachments[0]?.filePath
        ? getAttachmentUrl(initial.attachments[0].filePath)
        : undefined);
    useEffect(() => {
        if (initial) {
            setState((prev) => ({
                ...prev,
                attachmentIds: initial.attachments.map((a) => a.id).filter(Boolean)
            }));
            setAttachmentPreview(initial.attachments[0]?.filePath
                ? getAttachmentUrl(initial.attachments[0].filePath)
                : undefined);
        }
    }, [initial]);
    useEffect(() => {
        if (!initial) {
            setState(defaultState());
            setCustomValueMap({});
            setAttachmentPreview(undefined);
        }
    }, [initial?.id]);
    const setField = (key, value) => setState((prev) => ({ ...prev, [key]: value }));
    const handleCustomValue = (field, value) => {
        setCustomValueMap((prev) => ({
            ...prev,
            [field.id]: {
                fieldId: field.id,
                type: field.type,
                ...(field.type === "multiSelect"
                    ? { values: value }
                    : { value })
            }
        }));
    };
    const payload = useMemo(() => {
        return {
            ...state,
            customValues: Object.values(customValueMap)
        };
    }, [state, customValueMap]);
    const onSubmit = async (e) => {
        e.preventDefault();
        await onSaved({
            ...payload,
            datetime: toIsoFromLocal(payload.datetime)
        });
        if (!initial) {
            setState(defaultState());
            setCustomValueMap({});
            setAttachmentPreview(undefined);
        }
    };
    const uploadFile = async (file) => {
        setUploading(true);
        try {
            const res = await api.uploadAttachment(file, initial?.id);
            setState((prev) => ({
                ...prev,
                attachmentIds: [res.id]
            }));
            setAttachmentPreview(getAttachmentUrl(res.filePath));
        }
        finally {
            setUploading(false);
        }
    };
    return (_jsxs("form", { className: "card", onSubmit: onSubmit, style: { marginBottom: "0.5rem" }, children: [_jsxs("div", { style: { display: "flex", gap: "1rem", flexWrap: "wrap" }, children: [_jsxs("label", { style: { flex: "1 1 220px" }, children: [_jsx("div", { children: "Date & Time" }), _jsx("input", { className: "input", type: "datetime-local", value: toInputDateTime(state.datetime), onChange: (e) => setField("datetime", e.target.value) })] }), _jsxs("label", { style: { flex: "1 1 160px" }, children: [_jsx("div", { children: "Symbol" }), _jsx("input", { className: "input", value: state.symbol, onChange: (e) => setField("symbol", e.target.value), placeholder: "AAPL, BTCUSDT..." })] }), _jsxs("label", { style: { flex: "1 1 160px" }, children: [_jsx("div", { children: "Account" }), _jsxs("select", { className: "select", value: state.accountType, onChange: (e) => setField("accountType", e.target.value), children: [_jsx("option", { value: "live", children: "Live" }), _jsx("option", { value: "sim", children: "Sim" })] })] }), _jsxs("label", { style: { flex: "1 1 160px" }, children: [_jsx("div", { children: "Result" }), _jsxs("select", { className: "select", value: state.result, onChange: (e) => setField("result", e.target.value), children: [_jsx("option", { value: "takeProfit", children: "Take Profit" }), _jsx("option", { value: "stopLoss", children: "Stop Loss" }), _jsx("option", { value: "breakeven", children: "Breakeven" }), _jsx("option", { value: "manualExit", children: "Manual Exit" })] })] })] }), _jsxs("div", { style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "0.75rem",
                    marginTop: "0.75rem"
                }, children: [_jsxs("label", { children: [_jsx("div", { children: "PNL" }), _jsx("input", { className: "input", type: "number", value: state.pnl, onChange: (e) => setField("pnl", Number(e.target.value)) })] }), _jsxs("label", { children: [_jsx("div", { children: "Risk Amount" }), _jsx("input", { className: "input", type: "number", value: state.riskAmount, onChange: (e) => setField("riskAmount", Number(e.target.value)) })] }), _jsxs("label", { children: [_jsx("div", { children: "R Multiple" }), _jsx("input", { className: "input", type: "number", value: state.rMultiple ?? "", onChange: (e) => setField("rMultiple", e.target.value === "" ? null : Number(e.target.value)) })] }), _jsxs("label", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [_jsx("input", { type: "checkbox", checked: state.complied, onChange: (e) => setField("complied", e.target.checked) }), _jsx("span", { children: "Complied with rules" })] })] }), _jsxs("div", { style: { marginTop: "0.75rem" }, children: [_jsx("div", { children: "Tags" }), _jsx("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" }, children: tags.map((tag) => {
                            const checked = state.tagIds.includes(tag.id);
                            return (_jsxs("label", { style: {
                                    padding: "0.35rem 0.65rem",
                                    borderRadius: "999px",
                                    border: `1px solid ${checked ? "rgba(79,70,229,0.6)" : "rgba(255,255,255,0.1)"}`,
                                    cursor: "pointer",
                                    background: checked ? "rgba(79,70,229,0.15)" : "transparent"
                                }, children: [_jsx("input", { type: "checkbox", style: { marginRight: "0.3rem" }, checked: checked, onChange: (e) => {
                                            const next = e.target.checked
                                                ? [...state.tagIds, tag.id]
                                                : state.tagIds.filter((t) => t !== tag.id);
                                            setField("tagIds", next);
                                        } }), tag.name] }, tag.id));
                        }) })] }), customFields.length > 0 && (_jsxs("div", { style: { marginTop: "1rem" }, children: [_jsx("div", { style: { marginBottom: "0.35rem" }, children: "Custom Fields" }), _jsx("div", { style: {
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "0.75rem"
                        }, children: customFields.map((field) => {
                            const current = customValueMap[field.id];
                            if (field.type === "boolean") {
                                return (_jsxs("label", { style: { display: "flex", gap: "0.5rem" }, children: [_jsx("input", { type: "checkbox", checked: current?.value ?? false, onChange: (e) => handleCustomValue(field, e.target.checked) }), _jsx("span", { children: field.label })] }, field.id));
                            }
                            if (field.type === "singleSelect") {
                                return (_jsxs("label", { children: [_jsx("div", { children: field.label }), _jsxs("select", { className: "select", value: current?.value ?? "", onChange: (e) => handleCustomValue(field, e.target.value), children: [_jsx("option", { value: "", children: "Select" }), field.options?.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] })] }, field.id));
                            }
                            if (field.type === "multiSelect") {
                                const values = current?.values ?? [];
                                return (_jsxs("div", { children: [_jsx("div", { children: field.label }), _jsx("div", { style: { display: "flex", gap: "0.35rem", flexWrap: "wrap" }, children: field.options?.map((opt) => {
                                                const checked = values.includes(opt.value);
                                                return (_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (e) => {
                                                                const next = e.target.checked
                                                                    ? [...values, opt.value]
                                                                    : values.filter((v) => v !== opt.value);
                                                                handleCustomValue(field, next);
                                                            } }), " ", opt.label] }, opt.value));
                                            }) })] }, field.id));
                            }
                            if (field.type === "number") {
                                return (_jsxs("label", { children: [_jsx("div", { children: field.label }), _jsx("input", { className: "input", type: "number", value: current?.value ?? "", onChange: (e) => handleCustomValue(field, e.target.value === "" ? undefined : Number(e.target.value)) })] }, field.id));
                            }
                            if (field.type === "date") {
                                return (_jsxs("label", { children: [_jsx("div", { children: field.label }), _jsx("input", { className: "input", type: "date", value: current?.value ?? "", onChange: (e) => handleCustomValue(field, e.target.value) })] }, field.id));
                            }
                            if (field.type === "datetime") {
                                return (_jsxs("label", { children: [_jsx("div", { children: field.label }), _jsx("input", { className: "input", type: "datetime-local", value: current?.value ? toInputDateTime(current.value) : "", onChange: (e) => handleCustomValue(field, e.target.value) })] }, field.id));
                            }
                            return (_jsxs("label", { children: [_jsx("div", { children: field.label }), _jsx("input", { className: "input", value: current?.value ?? "", onChange: (e) => handleCustomValue(field, e.target.value) })] }, field.id));
                        }) })] })), _jsxs("div", { style: { marginTop: "0.75rem" }, children: [_jsx("div", { children: "Notes" }), _jsx("textarea", { className: "textarea", rows: 3, value: state.notes, onChange: (e) => setField("notes", e.target.value) })] }), _jsxs("div", { style: { marginTop: "0.75rem", display: "flex", gap: "1rem", alignItems: "center" }, children: [_jsx("div", { children: _jsxs("label", { className: "btn secondary", style: { cursor: "pointer" }, children: [uploading ? "Uploading..." : "Upload Image", _jsx("input", { type: "file", accept: "image/png,image/jpeg,image/webp", style: { display: "none" }, onChange: (e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                            uploadFile(file);
                                    } })] }) }), attachmentPreview && (_jsx("img", { src: attachmentPreview, alt: "attachment", style: { height: 80, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" } }))] }), _jsxs("div", { style: { marginTop: "1rem", display: "flex", gap: "0.5rem" }, children: [_jsx("button", { className: "btn", type: "submit", children: "Save" }), onCancel && (_jsx("button", { className: "btn secondary", type: "button", onClick: onCancel, children: "Cancel" }))] })] }));
}
