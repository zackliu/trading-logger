import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
const emptyForm = () => ({
    key: "",
    label: "",
    type: "text",
    isRequired: false,
    options: []
});
export default function SettingsFieldsPage() {
    const queryClient = useQueryClient();
    const { data: fields = [] } = useQuery({
        queryKey: ["customFields"],
        queryFn: api.listCustomFields
    });
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const createMutation = useMutation({
        mutationFn: (data) => api.createCustomField(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customFields"] });
            setForm(emptyForm());
        }
    });
    const updateMutation = useMutation({
        mutationFn: (input) => api.updateCustomField(input.id, input.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customFields"] });
            setEditingId(null);
            setForm(emptyForm());
        }
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteCustomField(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customFields"] })
    });
    useEffect(() => {
        if (editingId && fields) {
            const field = fields.find((f) => f.id === editingId);
            if (field) {
                setForm({
                    key: field.key,
                    label: field.label,
                    type: field.type,
                    isRequired: field.isRequired ?? false,
                    options: field.options?.map((o) => ({ label: o.label, value: o.value })) ?? []
                });
            }
        }
    }, [editingId, fields]);
    const submit = () => {
        const payload = { ...form };
        if (form.type === "singleSelect" || form.type === "multiSelect") {
            payload.options = form.options.map((o, idx) => ({
                ...o,
                sortOrder: idx
            }));
        }
        else {
            payload.options = [];
        }
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        }
        else {
            createMutation.mutate(payload);
        }
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Custom Fields" }), _jsxs("div", { className: "card", style: { marginBottom: "1rem" }, children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }, children: [_jsxs("label", { children: [_jsx("div", { children: "Key" }), _jsx("input", { className: "input", value: form.key, onChange: (e) => setForm((f) => ({ ...f, key: e.target.value })) })] }), _jsxs("label", { children: [_jsx("div", { children: "Label" }), _jsx("input", { className: "input", value: form.label, onChange: (e) => setForm((f) => ({ ...f, label: e.target.value })) })] }), _jsxs("label", { children: [_jsx("div", { children: "Type" }), _jsxs("select", { className: "select", value: form.type, onChange: (e) => setForm((f) => ({ ...f, type: e.target.value })), children: [_jsx("option", { value: "text", children: "Text" }), _jsx("option", { value: "number", children: "Number" }), _jsx("option", { value: "boolean", children: "Boolean" }), _jsx("option", { value: "singleSelect", children: "Single Select" }), _jsx("option", { value: "multiSelect", children: "Multi Select" }), _jsx("option", { value: "date", children: "Date" }), _jsx("option", { value: "datetime", children: "Datetime" })] })] }), _jsxs("label", { style: { display: "flex", alignItems: "center", gap: "0.3rem" }, children: [_jsx("input", { type: "checkbox", checked: form.isRequired, onChange: (e) => setForm((f) => ({ ...f, isRequired: e.target.checked })) }), _jsx("span", { children: "Required" })] })] }), (form.type === "singleSelect" || form.type === "multiSelect") && (_jsxs("div", { style: { marginTop: "0.5rem" }, children: [_jsx("div", { children: "Options" }), form.options.map((opt, idx) => (_jsxs("div", { style: { display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }, children: [_jsx("input", { className: "input", placeholder: "Label", value: opt.label, onChange: (e) => setForm((f) => {
                                            const opts = [...f.options];
                                            opts[idx] = { ...opts[idx], label: e.target.value };
                                            return { ...f, options: opts };
                                        }) }), _jsx("input", { className: "input", placeholder: "Value", value: opt.value, onChange: (e) => setForm((f) => {
                                            const opts = [...f.options];
                                            opts[idx] = { ...opts[idx], value: e.target.value };
                                            return { ...f, options: opts };
                                        }) }), _jsx("button", { className: "btn secondary", onClick: () => setForm((f) => ({
                                            ...f,
                                            options: f.options.filter((_, i) => i !== idx)
                                        })), children: "Remove" })] }, idx))), _jsx("button", { className: "btn secondary", onClick: () => setForm((f) => ({
                                    ...f,
                                    options: [...f.options, { label: "", value: "" }]
                                })), children: "Add option" })] })), _jsxs("div", { style: { marginTop: "0.75rem", display: "flex", gap: "0.5rem" }, children: [_jsx("button", { className: "btn", onClick: submit, children: editingId ? "Update field" : "Create field" }), editingId && (_jsx("button", { className: "btn secondary", onClick: () => {
                                    setEditingId(null);
                                    setForm(emptyForm());
                                }, children: "Cancel" }))] })] }), _jsx("div", { className: "card", children: fields?.map((field) => (_jsxs("div", { style: {
                        borderTop: "1px solid #e6e9f0",
                        padding: "0.5rem 0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: field.label }), _jsxs("div", { style: { opacity: 0.7, fontSize: "0.9rem" }, children: [field.key, " \u00B7 ", field.type, " ", field.isRequired ? "\u00B7 required" : ""] }), field.options && field.options.length > 0 && (_jsx("div", { style: { display: "flex", gap: "0.35rem", flexWrap: "wrap" }, children: field.options.map((opt) => (_jsxs("span", { className: "tag", children: [opt.label, " (", opt.value, ")"] }, opt.value))) }))] }), _jsxs("div", { style: { display: "flex", gap: "0.35rem" }, children: [_jsx("button", { className: "btn secondary", onClick: () => setEditingId(field.id), children: "Edit" }), _jsx("button", { className: "btn danger", onClick: () => deleteMutation.mutate(field.id), children: "Delete" })] })] }, field.id))) })] }));
}
