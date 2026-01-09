import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
export default function SettingsCompliancePage() {
    const qc = useQueryClient();
    const { data: checks = [] } = useQuery({
        queryKey: ["complianceChecks"],
        queryFn: api.listComplianceChecks
    });
    const createMutation = useMutation({
        mutationFn: api.createComplianceCheck,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["complianceChecks"] })
    });
    const deleteMutation = useMutation({
        mutationFn: api.deleteComplianceCheck,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["complianceChecks"] })
    });
    const [label, setLabel] = useState("");
    const [type, setType] = useState("checkbox");
    const [optionsText, setOptionsText] = useState("");
    const handleCreate = async () => {
        if (!label.trim())
            return;
        const options = type === "setup"
            ? optionsText
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((label, idx) => ({ label, sortOrder: idx }))
            : undefined;
        await createMutation.mutateAsync({ label, type, options });
        setLabel("");
        setOptionsText("");
    };
    return (_jsxs("div", { children: [_jsx("h2", { style: { marginTop: 0 }, children: "Compliance Checklist" }), _jsx("p", { style: { opacity: 0.75 }, children: "Define checklist items and setup selections shown on the record form. All items must be satisfied for a record to be marked complied." }), _jsxs("div", { className: "card", style: { display: "grid", gap: "0.75rem", marginBottom: "1rem" }, children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }, children: [_jsxs("label", { children: [_jsx("div", { children: "Label" }), _jsx("input", { className: "input", value: label, onChange: (e) => setLabel(e.target.value) })] }), _jsxs("label", { children: [_jsx("div", { children: "Type" }), _jsxs("select", { className: "select", value: type, onChange: (e) => setType(e.target.value), children: [_jsx("option", { value: "checkbox", children: "Checkbox" }), _jsx("option", { value: "setup", children: "Setup (single select)" })] })] })] }), type === "setup" && (_jsxs("label", { children: [_jsx("div", { children: "Options (one per line)" }), _jsx("textarea", { className: "textarea", rows: 4, value: optionsText, onChange: (e) => setOptionsText(e.target.value) })] })), _jsx("button", { className: "btn", type: "button", onClick: handleCreate, disabled: createMutation.isPending, children: "Add Item" })] }), _jsxs("div", { style: { display: "grid", gap: "0.75rem" }, children: [checks.map((c) => (_jsxs("div", { className: "card", style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700 }, children: c.label }), _jsxs("div", { style: { opacity: 0.7, fontSize: "0.9rem" }, children: [c.type === "checkbox" ? "Checkbox" : "Setup", " ", c.type === "setup" && c.options?.length
                                                ? `• Options: ${c.options.map((o) => o.label).join(", ")}`
                                                : ""] })] }), _jsx("button", { className: "btn danger", onClick: () => deleteMutation.mutate(c.id), disabled: deleteMutation.isPending, children: "Delete" })] }, c.id))), checks.length === 0 && (_jsx("div", { className: "card", style: { opacity: 0.7 }, children: "No checklist items yet. Add one above." }))] })] }));
}
