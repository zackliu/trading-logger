import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { api, getAttachmentUrl } from "../api/client";
import { formatDateTime } from "../utils/format";
export default function RecordDetailPage() {
    const params = useParams();
    const navigate = useNavigate();
    const id = Number(params.id);
    const { data, isLoading, isError } = useQuery({
        queryKey: ["record", id],
        queryFn: () => api.getRecord(id),
        enabled: Number.isFinite(id)
    });
    const { data: customFields = [] } = useQuery({
        queryKey: ["customFields"],
        queryFn: api.listCustomFields
    });
    const fieldMap = useMemo(() => {
        const map = new Map();
        customFields?.forEach((f) => map.set(f.id, f.label));
        return map;
    }, [customFields]);
    if (isLoading)
        return _jsx("div", { children: "Loading..." });
    if (isError || !data)
        return _jsx("div", { children: "Record not found." });
    return (_jsxs("div", { className: "card", children: [_jsx("button", { className: "btn secondary", onClick: () => navigate(-1), children: "\u2190 Back" }), _jsx("h2", { style: { marginBottom: "0.25rem" }, children: data.symbol }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }, children: [_jsx(Detail, { label: "Datetime", value: formatDateTime(data.datetime) }), _jsx(Detail, { label: "Account", value: data.accountType }), _jsx(Detail, { label: "Result", value: data.result }), _jsx(Detail, { label: "R Multiple", value: data.rMultiple ?? "-" }), _jsx(Detail, { label: "Complied", value: data.complied ? "Yes" : "No" })] }), _jsxs("div", { style: { marginTop: "0.75rem" }, children: [_jsx("strong", { children: "Tags:" }), " ", data.tags.map((t) => (_jsx("span", { className: "tag", style: { marginRight: "0.3rem" }, children: t.name }, t.id)))] }), data.customValues.length > 0 && (_jsxs("div", { style: { marginTop: "0.75rem" }, children: [_jsx("strong", { children: "Custom Fields" }), _jsx("ul", { children: data.customValues.map((cv) => (_jsxs("li", { children: [_jsxs("strong", { children: [fieldMap.get(cv.fieldId) ?? cv.fieldId, ":"] }), " ", "value" in cv
                                    ? cv.value?.toString()
                                    : cv.values?.join(", ")] }, `${cv.fieldId}-${cv.type}`))) })] })), _jsxs("div", { style: { marginTop: "0.75rem" }, children: [_jsx("strong", { children: "Notes" }), _jsx("p", { style: { whiteSpace: "pre-wrap" }, children: data.notes })] }), data.attachments.length > 0 && (_jsx("div", { style: { marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }, children: data.attachments.map((att) => (_jsx("img", { src: getAttachmentUrl(att.filePath), alt: "attachment", style: { width: 220, borderRadius: 12, border: "1px solid #e6e9f0" } }, att.id))) }))] }));
}
function Detail({ label, value }) {
    return (_jsxs("div", { style: { background: "#f7f8fb", padding: "0.55rem 0.7rem", borderRadius: 10, border: "1px solid #e6e9f0" }, children: [_jsx("div", { style: { opacity: 0.7, fontSize: "0.85rem" }, children: label }), _jsx("div", { style: { fontWeight: 600 }, children: value })] }));
}
