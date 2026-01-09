import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
export default function SettingsTagsPage() {
    const queryClient = useQueryClient();
    const { data: tags = [] } = useQuery({
        queryKey: ["tags"],
        queryFn: api.listTags
    });
    const [form, setForm] = useState({ name: "", color: "#4F46E5" });
    const [editing, setEditing] = useState(null);
    const createMutation = useMutation({
        mutationFn: (payload) => api.createTag(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tags"] });
            setForm({ name: "", color: "#4F46E5" });
        }
    });
    const updateMutation = useMutation({
        mutationFn: (input) => api.updateTag(input.id, { name: input.name, color: input.color }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] })
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => api.deleteTag(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] })
    });
    return (_jsxs("div", { children: [_jsx("h2", { children: "Tags" }), _jsx("div", { className: "card", style: { maxWidth: 420, marginBottom: "1rem" }, children: _jsxs("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" }, children: [_jsx("input", { className: "input", placeholder: "Name", value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })) }), _jsx("input", { className: "input", type: "color", value: form.color, onChange: (e) => setForm((f) => ({ ...f, color: e.target.value })) }), _jsx("button", { className: "btn", onClick: () => createMutation.mutate({ name: form.name, color: form.color }), children: "Add tag" })] }) }), _jsx("div", { className: "card", children: tags?.map((tag) => {
                    const isEditing = editing?.id === tag.id;
                    return (_jsx("div", { style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            borderTop: "1px solid rgba(255,255,255,0.08)",
                            padding: "0.5rem 0"
                        }, children: isEditing ? (_jsxs(_Fragment, { children: [_jsx("input", { className: "input", value: editing?.name ?? "", onChange: (e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev) }), _jsx("input", { className: "input", type: "color", value: editing?.color ?? "#4F46E5", onChange: (e) => setEditing((prev) => prev ? { ...prev, color: e.target.value } : prev) }), _jsx("button", { className: "btn secondary", onClick: () => {
                                        if (editing) {
                                            updateMutation.mutate(editing);
                                            setEditing(null);
                                        }
                                    }, children: "Save" }), _jsx("button", { className: "btn secondary", onClick: () => setEditing(null), children: "Cancel" })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "tag", style: { background: tag.color ?? "rgba(255,255,255,0.08)" }, children: tag.name }), _jsx("button", { className: "btn secondary", onClick: () => setEditing({ id: tag.id, name: tag.name, color: tag.color }), children: "Edit" }), _jsx("button", { className: "btn danger", onClick: () => deleteMutation.mutate(tag.id), children: "Delete" })] })) }, tag.id));
                }) })] }));
}
