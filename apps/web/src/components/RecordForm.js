import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { api, getAttachmentUrl } from "../api/client";
import { toInputDateTime, toIsoFromLocal } from "../utils/format";
import clsx from "clsx";
const defaultState = (setupId) => ({
    datetime: new Date().toISOString(),
    symbol: "",
    setupId,
    accountType: "sim",
    result: "takeProfit",
    rMultiple: null,
    complied: false,
    notes: "",
    tagIds: [],
    customValues: [],
    attachmentIds: [],
    complianceSelections: []
});
export default function RecordForm({ initial, tags, setups, customFields, complianceChecks, onSaved, onCancel }) {
    const defaultSetupId = useMemo(() => {
        if (!setups?.length)
            return 1;
        const unknown = setups.find((s) => s.name.toLowerCase() === "unknown");
        return unknown?.id ?? setups[0].id ?? 1;
    }, [setups]);
    const [state, setState] = useState(() => initial
        ? {
            datetime: initial.datetime,
            symbol: initial.symbol,
            setupId: initial.setupId,
            accountType: initial.accountType,
            result: initial.result,
            rMultiple: initial.rMultiple ?? null,
            complied: initial.complied,
            notes: initial.notes ?? "",
            tagIds: initial.tags.map((t) => t.id) ?? [],
            customValues: [],
            attachmentIds: initial.attachments.map((a) => a.id).filter(Boolean),
            complianceSelections: initial.complianceSelections ?? []
        }
        : defaultState(defaultSetupId));
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
    const [dragging, setDragging] = useState(false);
    const [complianceSelections, setComplianceSelections] = useState(initial?.complianceSelections ?? []);
    const [showRCalc, setShowRCalc] = useState(false);
    const [calcStopSize, setCalcStopSize] = useState("");
    const [calcPl, setCalcPl] = useState("");
    const derivedRFromCalc = useMemo(() => {
        const stop = Number(calcStopSize);
        const pnl = Number(calcPl);
        if (!Number.isFinite(stop) || !Number.isFinite(pnl) || stop === 0)
            return null;
        return Number((pnl / stop).toFixed(2));
    }, [calcStopSize, calcPl]);
    const emotions = [
        {
            value: "fear",
            label: "恐惧/焦虑",
            hint: "避免痛苦：过度保守或防御，不敢按计划进/稍回撤就跑/加仓求确定性。自检：我是不是只想赶紧确定结果、频繁刷新价格求安全感？"
        },
        {
            value: "greed",
            label: "贪婪/兴奋",
            hint: "追求快感：放大胜率、缩小风险感，追涨杀跌、扩大仓位。自检：我是不是已经把盈利花掉了，或觉得这波不一样？"
        },
        {
            value: "anger",
            label: "愤怒/报复",
            hint: "恢复尊严：把市场当对手，想扳回来导致频率变高标准变松。自检：我是不是在想“凭什么刚才打我止损”？"
        },
        {
            value: "overconfidence",
            label: "自负/亢奋",
            hint: "掌控一切：忽略反例，连赢后加杠杆或跳过检查。自检：我是不是觉得自己状态太好，不需要那么多规矩？"
        },
        {
            value: "regret",
            label: "懊悔/错过恐惧",
            hint: "补一口气：错过或卖飞后急着重进，条件不完整也上。自检：如果这单不做我会不会强烈不舒服，我主要在看走了多少吗？"
        },
        {
            value: "hope",
            label: "希望/否认",
            hint: "推迟承认错误：扛单、挪止损、等反弹。自检：我是不是在等一个小反弹让我好受一点，或不愿按规则出场？"
        },
        {
            value: "boredom",
            label: "无聊/寻刺激",
            hint: "找事情做：过度交易，把无优势的波动当机会。自检：我是不是因为没单可做而焦躁，在随便找理由下单？"
        },
        {
            value: "fatigue",
            label: "疲劳/麻木",
            hint: "注意力下降：漏看信息、反应慢、执行粗糙或摆烂。自检：我是不是看图看不进去，对风险提示无感？"
        },
        {
            value: "confusion",
            label: "困惑/信息过载",
            hint: "找确定性但找不到：加指标、换周期、改假设，最后随机动作。自检：我能一句话说清逻辑吗？说不清通常就是困惑。"
        },
        {
            value: "calm",
            label: "平静/专注",
            hint: "情绪不主导动作：接受不确定，能按规则做也能按规则不做。自检：不触发能否轻松走开，触发止损能否平静执行？"
        }
    ];
    const derivedComplied = useMemo(() => {
        if (!complianceChecks.length)
            return state.complied;
        for (const check of complianceChecks) {
            const sel = complianceSelections.find((s) => s.checkId === check.id);
            if (check.type === "checkbox") {
                if (!sel || sel.type !== "checkbox" || !sel.checked)
                    return false;
            }
            else {
                if (!sel || sel.type !== "setup" || sel.optionId === null)
                    return false;
            }
        }
        return true;
    }, [complianceChecks, complianceSelections, state.complied]);
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
            setState(defaultState(defaultSetupId));
            setCustomValueMap({});
            setAttachmentPreview(undefined);
            setComplianceSelections([]);
        }
    }, [initial?.id, defaultSetupId]);
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
            customValues: Object.values(customValueMap),
            complianceSelections
        };
    }, [state, customValueMap, complianceSelections]);
    useEffect(() => {
        const handler = (e) => {
            const target = e.target;
            if (!target.closest(".r-calc-popover") && !target.closest(".r-calc-trigger")) {
                setShowRCalc(false);
            }
        };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);
    const onSubmit = async (e) => {
        e.preventDefault();
        await onSaved({
            ...payload,
            complied: derivedComplied,
            datetime: toIsoFromLocal(payload.datetime)
        });
        if (!initial) {
            setState(defaultState(defaultSetupId));
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
    const tryHandleFile = (file) => {
        if (!file)
            return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
            return;
        uploadFile(file);
    };
    const handlePaste = (e) => {
        const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
        if (item) {
            const file = item.getAsFile();
            tryHandleFile(file);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        tryHandleFile(file);
    };
    return (_jsxs("form", { className: "card", onSubmit: onSubmit, style: { marginBottom: "0.5rem" }, children: [_jsxs("div", { style: { display: "flex", gap: "1rem", flexWrap: "wrap" }, children: [_jsxs("label", { style: { flex: "1 1 220px" }, children: [_jsx("div", { children: "Date & Time" }), _jsx("input", { className: "input", type: "datetime-local", value: toInputDateTime(state.datetime), onChange: (e) => setField("datetime", e.target.value) })] }), _jsxs("label", { style: { flex: "1 1 160px" }, children: [_jsx("div", { children: "Symbol" }), _jsx("input", { className: "input", value: state.symbol, onChange: (e) => setField("symbol", e.target.value), placeholder: "AAPL, BTCUSDT..." })] }), _jsxs("label", { style: { flex: "1 1 180px" }, children: [_jsx("div", { children: "Setup" }), _jsxs("select", { className: "select", value: state.setupId, onChange: (e) => setField("setupId", Number(e.target.value)), children: [setups.length === 0 && _jsx("option", { value: state.setupId, children: "Unknown" }), setups.map((setup) => (_jsx("option", { value: setup.id, children: setup.name }, setup.id)))] })] }), _jsxs("label", { style: { flex: "1 1 160px" }, children: [_jsx("div", { children: "Account" }), _jsxs("select", { className: "select", value: state.accountType, onChange: (e) => setField("accountType", e.target.value), children: [_jsx("option", { value: "live", children: "Live" }), _jsx("option", { value: "sim", children: "Sim" })] })] })] }), _jsxs("div", { style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "0.75rem",
                    marginTop: "0.75rem",
                    alignItems: "end"
                }, children: [_jsxs("label", { children: [_jsx("div", { children: "Result" }), _jsxs("select", { className: "select", value: state.result, onChange: (e) => setField("result", e.target.value), children: [_jsx("option", { value: "takeProfit", children: "Take Profit" }), _jsx("option", { value: "stopLoss", children: "Stop Loss" }), _jsx("option", { value: "breakeven", children: "Breakeven" }), _jsx("option", { value: "manualExit", children: "Manual Exit" })] })] }), _jsxs("label", { children: [_jsxs("div", { style: {
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "0.35rem"
                                }, children: [_jsx("span", { children: "R Multiple" }), _jsx("button", { type: "button", onClick: () => setShowRCalc((v) => !v), className: "r-calc-trigger", style: {
                                            width: 28,
                                            height: 28,
                                            borderRadius: 8,
                                            border: "1px solid #d5dbe7",
                                            background: "#f7f8fb",
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.9rem",
                                            color: "#0b1d32"
                                        }, "aria-label": "Open R calculator", children: "\uD83E\uDDEE" })] }), _jsx("input", { className: "input", type: "number", value: state.rMultiple ?? "", onChange: (e) => setField("rMultiple", e.target.value === "" ? null : Number(e.target.value)) })] }), showRCalc && (_jsx("div", { className: "r-calc-popover", onClick: (e) => e.stopPropagation(), style: {
                            position: "fixed",
                            inset: 0,
                            background: "rgba(15,23,42,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 60,
                            padding: "1rem"
                        }, children: _jsxs("div", { style: {
                                width: 320,
                                background: "white",
                                border: "1px solid #e6e9f0",
                                borderRadius: 14,
                                padding: "0.9rem",
                                boxShadow: "0 22px 48px rgba(17,24,39,0.22)",
                                display: "grid",
                                gap: "0.6rem"
                            }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("div", { style: { fontWeight: 700 }, children: "R \u8BA1\u7B97\u5668" }), _jsx("button", { type: "button", className: "btn secondary", onClick: () => setShowRCalc(false), style: { padding: "0.3rem 0.6rem" }, children: "\u5173\u95ED" })] }), _jsxs("label", { style: { fontSize: "0.95rem", color: "#475569" }, children: [_jsx("div", { children: "\u6B62\u635F\u5927\u5C0F" }), _jsx("input", { className: "input", type: "number", value: calcStopSize, onChange: (e) => setCalcStopSize(e.target.value), placeholder: "\u4F8B\u5982 100" })] }), _jsxs("label", { style: { fontSize: "0.95rem", color: "#475569" }, children: [_jsx("div", { children: "\u5B9E\u9645\u76C8\u4E8F" }), _jsx("input", { className: "input", type: "number", value: calcPl, onChange: (e) => setCalcPl(e.target.value), placeholder: "\u53EF\u586B\u6B63\u8D1F\u6570" })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [_jsxs("div", { style: { fontWeight: 800, fontSize: "1.1rem" }, children: ["R = ", derivedRFromCalc ?? "--"] }), _jsxs("div", { style: { display: "flex", gap: "0.4rem" }, children: [_jsx("button", { type: "button", className: "btn secondary", onClick: () => {
                                                        setCalcStopSize("");
                                                        setCalcPl("");
                                                        setShowRCalc(false);
                                                    }, children: "\u6E05\u7A7A" }), _jsx("button", { type: "button", className: "btn", disabled: derivedRFromCalc === null, onClick: () => {
                                                        if (derivedRFromCalc !== null) {
                                                            setField("rMultiple", derivedRFromCalc);
                                                            setCalcStopSize("");
                                                            setCalcPl("");
                                                            setShowRCalc(false);
                                                        }
                                                    }, children: "\u5E94\u7528" })] })] })] }) })), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [_jsx("span", { style: { opacity: 0.7 }, children: "Complied" }), _jsx("span", { className: "pill", style: { background: derivedComplied ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)", color: derivedComplied ? "#34D399" : "#F87171" }, children: derivedComplied ? "Yes" : "No" })] })] }), _jsxs("div", { style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "0.75rem",
                    marginTop: "0.5rem"
                }, children: [_jsxs("label", { children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.35rem" }, children: [_jsx("span", { children: "Entry Emotion" }), _jsx("span", { title: "\u5165\u573A\u65F6\u7684\u60C5\u7EEA\uFF0C\u60AC\u505C\u9009\u9879\u53EF\u8BFB\u89E3\u91CA", children: "?" })] }), _jsxs("select", { className: "select", value: state.entryEmotion ?? "", onChange: (e) => setField("entryEmotion", (e.target.value || undefined)), children: [_jsx("option", { value: "", children: "None" }), emotions.map((opt) => (_jsx("option", { value: opt.value, title: opt.hint, children: opt.label }, opt.value)))] })] }), _jsxs("label", { children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.35rem" }, children: [_jsx("span", { children: "Exit Emotion" }), _jsx("span", { title: "\u79BB\u573A\u65F6\u7684\u60C5\u7EEA\uFF0C\u60AC\u505C\u9009\u9879\u53EF\u8BFB\u89E3\u91CA", children: "?" })] }), _jsxs("select", { className: "select", value: state.exitEmotion ?? "", onChange: (e) => setField("exitEmotion", (e.target.value || undefined)), children: [_jsx("option", { value: "", children: "None" }), emotions.map((opt) => (_jsx("option", { value: opt.value, title: opt.hint, children: opt.label }, opt.value)))] })] })] }), _jsxs("div", { style: { marginTop: "0.75rem" }, children: [_jsx("div", { children: "Tags" }), _jsx("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" }, children: tags.map((tag) => {
                            const checked = state.tagIds.includes(tag.id);
                            return (_jsxs("label", { style: {
                                    padding: "0.35rem 0.65rem",
                                    borderRadius: "999px",
                                    border: `1px solid ${checked ? "rgba(0,113,227,0.55)" : "#d5dbe7"}`,
                                    cursor: "pointer",
                                    background: checked ? "rgba(0,113,227,0.1)" : "transparent"
                                }, children: [_jsx("input", { type: "checkbox", style: { marginRight: "0.3rem" }, checked: checked, onChange: (e) => {
                                            const next = e.target.checked
                                                ? [...state.tagIds, tag.id]
                                                : state.tagIds.filter((t) => t !== tag.id);
                                            setField("tagIds", next);
                                        } }), tag.name] }, tag.id));
                        }) })] }), complianceChecks.length > 0 && (_jsxs("div", { style: { marginTop: "0.75rem" }, children: [_jsxs("div", { style: { marginBottom: "0.35rem", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("span", { children: "Compliance Checklist" }), _jsx("span", { className: "pill", style: { background: derivedComplied ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)", color: derivedComplied ? "#34D399" : "#F87171" }, children: derivedComplied ? "Complied" : "Incomplete" })] }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "0.65rem" }, children: complianceChecks.map((check) => {
                            if (check.type === "checkbox") {
                                const sel = complianceSelections.find((s) => s.checkId === check.id && s.type === "checkbox");
                                return (_jsxs("label", { style: { display: "flex", gap: "0.5rem", alignItems: "center" }, children: [_jsx("input", { type: "checkbox", checked: !!sel?.checked, onChange: (e) => {
                                                const next = complianceSelections.filter((s) => s.checkId !== check.id);
                                                setComplianceSelections([
                                                    ...next,
                                                    { type: "checkbox", checkId: check.id, checked: e.target.checked }
                                                ]);
                                            } }), _jsx("span", { children: check.label })] }, check.id));
                            }
                            const sel = complianceSelections.find((s) => s.checkId === check.id && s.type === "setup");
                            return (_jsxs("label", { children: [_jsx("div", { children: check.label }), _jsxs("select", { className: "select", value: sel?.optionId ?? "", onChange: (e) => {
                                            const val = e.target.value;
                                            const next = complianceSelections.filter((s) => s.checkId !== check.id);
                                            setComplianceSelections([
                                                ...next,
                                                {
                                                    type: "setup",
                                                    checkId: check.id,
                                                    optionId: val === "" ? null : Number(val)
                                                }
                                            ]);
                                        }, children: [_jsx("option", { value: "", children: "None" }), check.options?.map((opt) => (_jsx("option", { value: opt.id, children: opt.label }, opt.id)))] })] }, check.id));
                        }) })] })), customFields.length > 0 && (_jsxs("div", { style: { marginTop: "1rem" }, children: [_jsx("div", { style: { marginBottom: "0.35rem" }, children: "Custom Fields" }), _jsx("div", { style: {
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
                        }) })] })), _jsxs("div", { style: { marginTop: "0.75rem" }, children: [_jsx("div", { children: "Notes" }), _jsx("textarea", { className: "textarea", rows: 3, value: state.notes, onChange: (e) => setField("notes", e.target.value), onPaste: handlePaste, onDragOver: (e) => {
                            e.preventDefault();
                            setDragging(true);
                        }, onDragLeave: () => setDragging(false), onDrop: handleDrop, style: dragging ? { outline: "2px dashed rgba(124,58,237,0.5)" } : undefined })] }), _jsxs("div", { style: {
                    marginTop: "0.75rem",
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                    flexWrap: "wrap"
                }, children: [_jsxs("label", { className: clsx("btn", "secondary"), style: { cursor: "pointer" }, children: [uploading ? "Uploading..." : "Upload Image", _jsx("input", { type: "file", accept: "image/png,image/jpeg,image/webp", style: { display: "none" }, onChange: (e) => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                        uploadFile(file);
                                } })] }), attachmentPreview && (_jsxs("div", { style: { position: "relative", display: "inline-block" }, children: [_jsx("img", { src: attachmentPreview, alt: "attachment", style: { height: 80, borderRadius: 12, border: "1px solid #e6e9f0" } }), _jsx("button", { type: "button", onClick: () => {
                                    setAttachmentPreview(undefined);
                                    setState((prev) => ({ ...prev, attachmentIds: [] }));
                                }, style: {
                                    position: "absolute",
                                    top: -8,
                                    right: -8,
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    border: "none",
                                    background: "rgba(239,68,68,0.9)",
                                    color: "white",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 6px 16px rgba(0,0,0,0.35)"
                                }, "aria-label": "Remove attachment", children: "\u00C3\u2014" })] }))] }), _jsxs("div", { style: { marginTop: "1rem", display: "flex", gap: "0.5rem" }, children: [_jsx("button", { className: "btn", type: "submit", children: "Save" }), onCancel && (_jsx("button", { className: "btn secondary", type: "button", onClick: onCancel, children: "Cancel" }))] })] }));
}
