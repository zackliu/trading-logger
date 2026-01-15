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
    const { data: setups = [] } = useQuery({
        queryKey: ["setups"],
        queryFn: api.listSetups
    });
    const { data: checks = [] } = useQuery({
        queryKey: ["complianceChecks"],
        queryFn: api.listComplianceChecks
    });
    const [form, setForm] = useState({ name: "", color: "#4F46E5" });
    const [editing, setEditing] = useState(null);
    const [setupName, setSetupName] = useState("");
    const [setupSortOrder, setSetupSortOrder] = useState("");
    const [editingSetup, setEditingSetup] = useState(null);
    const [checkLabel, setCheckLabel] = useState("");
    const [checkType, setCheckType] = useState("checkbox");
    const [optionsText, setOptionsText] = useState("");
    const [editingCheck, setEditingCheck] = useState(null);
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
    const createSetupMutation = useMutation({
        mutationFn: (payload) => api.createSetup(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["setups"] });
            setSetupName("");
            setSetupSortOrder("");
        }
    });
    const updateSetupMutation = useMutation({
        mutationFn: (input) => api.updateSetup(input.id, {
            name: input.name,
            sortOrder: input.sortOrder
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["setups"] });
            setEditingSetup(null);
        }
    });
    const deleteSetupMutation = useMutation({
        mutationFn: (id) => api.deleteSetup(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["setups"] })
    });
    const createCheckMutation = useMutation({
        mutationFn: api.createComplianceCheck,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complianceChecks"] });
            setCheckLabel("");
            setOptionsText("");
        }
    });
    const deleteCheckMutation = useMutation({
        mutationFn: api.deleteComplianceCheck,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complianceChecks"] })
    });
    const updateCheckMutation = useMutation({
        mutationFn: (input) => api.updateComplianceCheck(input.id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complianceChecks"] });
            setEditingCheck(null);
        }
    });
    const addCheck = () => {
        if (!checkLabel.trim())
            return;
        const options = checkType === "setup"
            ? optionsText
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((label, idx) => ({ label, sortOrder: idx }))
            : undefined;
        createCheckMutation.mutate({ label: checkLabel, type: checkType, options });
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Setups" }), _jsx("p", { style: { opacity: 0.75, marginTop: 0 }, children: "Manage the single-select setups used on records and filters. \"Unknown\" is always kept." }), _jsx("div", { className: "card", style: { maxWidth: 460, marginBottom: "1rem" }, children: _jsxs("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" }, children: [_jsx("input", { className: "input", placeholder: "Name", value: setupName, onChange: (e) => setSetupName(e.target.value) }), _jsx("input", { className: "input", type: "number", placeholder: "Order", value: setupSortOrder, onChange: (e) => setSetupSortOrder(e.target.value), style: { width: 120 } }), _jsx("button", { className: "btn", onClick: () => createSetupMutation.mutate({
                                name: setupName,
                                sortOrder: setupSortOrder ? Number(setupSortOrder) : undefined
                            }), disabled: !setupName.trim(), children: "Add setup" })] }) }), _jsxs("div", { className: "card", children: [setups.map((setup) => {
                        const isEditing = editingSetup?.id === setup.id;
                        const isDefault = setup.name.toLowerCase() === "unknown";
                        if (isEditing) {
                            return (_jsxs("div", { style: {
                                    display: "grid",
                                    gap: "0.5rem",
                                    borderTop: "1px solid #e6e9f0",
                                    padding: "0.5rem 0"
                                }, children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.5rem" }, children: [_jsx("input", { className: "input", value: editingSetup?.name ?? "", onChange: (e) => setEditingSetup((prev) => prev ? { ...prev, name: e.target.value } : prev) }), _jsx("input", { className: "input", type: "number", value: editingSetup?.sortOrder ?? "", onChange: (e) => setEditingSetup((prev) => prev
                                                    ? {
                                                        ...prev,
                                                        sortOrder: e.target.value === "" ? undefined : Number(e.target.value)
                                                    }
                                                    : prev) })] }), _jsxs("div", { style: { display: "flex", gap: "0.5rem" }, children: [_jsx("button", { className: "btn secondary", onClick: () => {
                                                    if (!editingSetup || !editingSetup.name.trim())
                                                        return;
                                                    updateSetupMutation.mutate({
                                                        id: editingSetup.id,
                                                        name: editingSetup.name,
                                                        sortOrder: editingSetup.sortOrder
                                                    });
                                                }, children: "Save" }), _jsx("button", { className: "btn secondary", onClick: () => setEditingSetup(null), children: "Cancel" })] })] }, setup.id));
                        }
                        return (_jsxs("div", { style: {
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                borderTop: "1px solid #e6e9f0",
                                padding: "0.5rem 0",
                                justifyContent: "space-between"
                            }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }, children: [_jsx("span", { className: "pill", children: setup.name }), _jsxs("span", { style: { opacity: 0.65, fontSize: "0.9rem" }, children: ["Order: ", setup.sortOrder ?? 0] }), isDefault && (_jsx("span", { className: "pill", style: { background: "rgba(16,185,129,0.15)", color: "#34D399" }, children: "Default" }))] }), _jsxs("div", { style: { display: "flex", gap: "0.4rem" }, children: [_jsx("button", { className: "btn secondary", disabled: isDefault, onClick: () => setEditingSetup({
                                                id: setup.id,
                                                name: setup.name,
                                                sortOrder: setup.sortOrder
                                            }), children: "Edit" }), _jsx("button", { className: "btn danger", disabled: isDefault, onClick: () => deleteSetupMutation.mutate(setup.id), children: "Delete" })] })] }, setup.id));
                    }), setups.length === 0 && _jsx("div", { style: { opacity: 0.7 }, children: "No setups yet." })] }), _jsx("h2", { children: "Tags" }), _jsx("div", { className: "card", style: { maxWidth: 420, marginBottom: "1rem" }, children: _jsxs("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" }, children: [_jsx("input", { className: "input", placeholder: "Name", value: form.name, onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })) }), _jsx("input", { className: "input", type: "color", value: form.color, onChange: (e) => setForm((f) => ({ ...f, color: e.target.value })) }), _jsx("button", { className: "btn", onClick: () => createMutation.mutate({ name: form.name, color: form.color }), children: "Add tag" })] }) }), _jsx("div", { className: "card", children: tags?.map((tag) => {
                    const isEditing = editing?.id === tag.id;
                    return (_jsx("div", { style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            borderTop: "1px solid #e6e9f0",
                            padding: "0.5rem 0"
                        }, children: isEditing ? (_jsxs(_Fragment, { children: [_jsx("input", { className: "input", value: editing?.name ?? "", onChange: (e) => setEditing((prev) => prev ? { ...prev, name: e.target.value } : prev) }), _jsx("input", { className: "input", type: "color", value: editing?.color ?? "#4F46E5", onChange: (e) => setEditing((prev) => prev ? { ...prev, color: e.target.value } : prev) }), _jsx("button", { className: "btn secondary", onClick: () => {
                                        if (editing) {
                                            updateMutation.mutate(editing);
                                            setEditing(null);
                                        }
                                    }, children: "Save" }), _jsx("button", { className: "btn secondary", onClick: () => setEditing(null), children: "Cancel" })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "tag", style: { background: tag.color ?? "#eef2f8" }, children: tag.name }), _jsx("button", { className: "btn secondary", onClick: () => setEditing({ id: tag.id, name: tag.name, color: tag.color }), children: "Edit" }), _jsx("button", { className: "btn danger", onClick: () => deleteMutation.mutate(tag.id), children: "Delete" })] })) }, tag.id));
                }) }), _jsx("h2", { style: { marginTop: "2rem" }, children: "Compliance Checklist" }), _jsx("p", { style: { opacity: 0.75, marginTop: 0 }, children: "Define the checklist items used on the record form. All checkbox items must be checked and setup selections must not be \"None\" for a trade to be marked complied." }), _jsxs("div", { className: "card", style: { maxWidth: 520, marginBottom: "1rem", display: "grid", gap: "0.75rem" }, children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.5rem" }, children: [_jsxs("label", { children: [_jsx("div", { children: "Label" }), _jsx("input", { className: "input", value: checkLabel, onChange: (e) => setCheckLabel(e.target.value) })] }), _jsxs("label", { children: [_jsx("div", { children: "Type" }), _jsxs("select", { className: "select", value: checkType, onChange: (e) => setCheckType(e.target.value), children: [_jsx("option", { value: "checkbox", children: "Checkbox" }), _jsx("option", { value: "setup", children: "Setup (single select)" })] })] })] }), checkType === "setup" && (_jsxs("label", { children: [_jsx("div", { children: "Options (one per line)" }), _jsx("textarea", { className: "textarea", rows: 3, value: optionsText, onChange: (e) => setOptionsText(e.target.value) })] })), _jsx("button", { className: "btn", type: "button", onClick: addCheck, disabled: createCheckMutation.isPending, children: "Add checklist item" })] }), _jsxs("div", { className: "card", children: [checks.map((c) => {
                        const isEditing = editingCheck?.id === c.id;
                        if (isEditing) {
                            const ec = editingCheck;
                            return (_jsxs("div", { style: {
                                    display: "grid",
                                    gap: "0.5rem",
                                    borderTop: "1px solid #e6e9f0",
                                    padding: "0.5rem 0"
                                }, children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.5rem" }, children: [_jsx("input", { className: "input", value: ec.label, onChange: (e) => setEditingCheck((prev) => prev ? { ...prev, label: e.target.value } : prev) }), _jsxs("select", { className: "select", value: ec.type, onChange: (e) => setEditingCheck((prev) => prev ? { ...prev, type: e.target.value } : prev), children: [_jsx("option", { value: "checkbox", children: "Checkbox" }), _jsx("option", { value: "setup", children: "Setup (single select)" })] })] }), ec.type === "setup" && (_jsx("textarea", { className: "textarea", rows: 3, value: ec.optionsText, onChange: (e) => setEditingCheck((prev) => prev ? { ...prev, optionsText: e.target.value } : prev) })), _jsxs("div", { style: { display: "flex", gap: "0.5rem" }, children: [_jsx("button", { className: "btn secondary", onClick: () => {
                                                    if (!editingCheck)
                                                        return;
                                                    const options = ec.type === "setup"
                                                        ? ec.optionsText
                                                            .split("\n")
                                                            .map((s) => s.trim())
                                                            .filter(Boolean)
                                                            .map((label, idx) => ({ label, sortOrder: idx }))
                                                        : undefined;
                                                    updateCheckMutation.mutate({
                                                        id: ec.id,
                                                        label: ec.label,
                                                        type: ec.type,
                                                        options
                                                    });
                                                }, children: "Save" }), _jsx("button", { className: "btn secondary", onClick: () => setEditingCheck(null), children: "Cancel" })] })] }, c.id));
                        }
                        return (_jsxs("div", { style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0.5rem 0",
                                borderTop: "1px solid #e6e9f0"
                            }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700 }, children: c.label }), _jsxs("div", { style: { opacity: 0.7, fontSize: "0.9rem" }, children: [c.type === "checkbox" ? "Checkbox" : "Setup", " ", c.type === "setup" && c.options?.length
                                                    ? `\u2022 ${c.options.map((o) => o.label).join(", ")}`
                                                    : ""] })] }), _jsxs("div", { style: { display: "flex", gap: "0.4rem" }, children: [_jsx("button", { className: "btn secondary", onClick: () => setEditingCheck({
                                                id: c.id,
                                                label: c.label,
                                                type: c.type,
                                                optionsText: c.type === "setup"
                                                    ? (c.options ?? []).map((o) => o.label).join("\n")
                                                    : ""
                                            }), children: "Edit" }), _jsx("button", { className: "btn danger", onClick: () => deleteCheckMutation.mutate(c.id), disabled: deleteCheckMutation.isPending, children: "Delete" })] })] }, c.id));
                    }), checks.length === 0 && _jsx("div", { style: { opacity: 0.7 }, children: "No checklist items yet." })] })] }));
}
