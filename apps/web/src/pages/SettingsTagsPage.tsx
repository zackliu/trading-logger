import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { ComplianceCheck, Setup, Tag } from "@trading-logger/shared";

export default function SettingsTagsPage() {
  const queryClient = useQueryClient();
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: api.listTags
  });
  const { data: setups = [] } = useQuery<Setup[]>({
    queryKey: ["setups"],
    queryFn: api.listSetups
  });
  const { data: checks = [] } = useQuery<ComplianceCheck[]>({
    queryKey: ["complianceChecks"],
    queryFn: api.listComplianceChecks
  });
  const [form, setForm] = useState({ name: "", color: "#4F46E5" });
  const [editing, setEditing] = useState<{ id: number; name: string; color?: string } | null>(null);
  const [setupName, setSetupName] = useState("");
  const [setupSortOrder, setSetupSortOrder] = useState<string>("");
  const [editingSetup, setEditingSetup] = useState<{ id: number; name: string; sortOrder?: number } | null>(null);
  const [checkLabel, setCheckLabel] = useState("");
  const [checkType, setCheckType] = useState<"checkbox" | "setup">("checkbox");
  const [optionsText, setOptionsText] = useState("");
  const [editingCheck, setEditingCheck] = useState<{
    id: number;
    label: string;
    type: "checkbox" | "setup";
    optionsText: string;
  } | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; color?: string }) =>
      api.createTag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setForm({ name: "", color: "#4F46E5" });
    }
  });
  const updateMutation = useMutation({
    mutationFn: (input: { id: number; name: string; color?: string }) =>
      api.updateTag(input.id, { name: input.name, color: input.color }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] })
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteTag(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] })
  });
  const createSetupMutation = useMutation({
    mutationFn: (payload: { name: string; sortOrder?: number }) =>
      api.createSetup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setups"] });
      setSetupName("");
      setSetupSortOrder("");
    }
  });
  const updateSetupMutation = useMutation({
    mutationFn: (input: { id: number; name: string; sortOrder?: number }) =>
      api.updateSetup(input.id, {
        name: input.name,
        sortOrder: input.sortOrder
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setups"] });
      setEditingSetup(null);
    }
  });
  const deleteSetupMutation = useMutation({
    mutationFn: (id: number) => api.deleteSetup(id),
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
    mutationFn: (input: {
      id: number;
      label?: string;
      type?: "checkbox" | "setup";
      options?: { label: string; sortOrder?: number }[];
    }) => api.updateComplianceCheck(input.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complianceChecks"] });
      setEditingCheck(null);
    }
  });

  const addCheck = () => {
    if (!checkLabel.trim()) return;
    const options =
      checkType === "setup"
        ? optionsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((label, idx) => ({ label, sortOrder: idx }))
        : undefined;
    createCheckMutation.mutate({ label: checkLabel, type: checkType, options });
  };

  return (
    <div>
      <h2>Setups</h2>
      <p style={{ opacity: 0.75, marginTop: 0 }}>
        Manage the single-select setups used on records and filters. "Unknown" is always kept.
      </p>
      <div className="card" style={{ maxWidth: 460, marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Name"
            value={setupName}
            onChange={(e) => setSetupName(e.target.value)}
          />
          <input
            className="input"
            type="number"
            placeholder="Order"
            value={setupSortOrder}
            onChange={(e) => setSetupSortOrder(e.target.value)}
            style={{ width: 120 }}
          />
          <button
            className="btn"
            onClick={() =>
              createSetupMutation.mutate({
                name: setupName,
                sortOrder: setupSortOrder ? Number(setupSortOrder) : undefined
              })
            }
            disabled={!setupName.trim()}
          >
            Add setup
          </button>
        </div>
      </div>

      <div className="card">
        {setups.map((setup) => {
          const isEditing = editingSetup?.id === setup.id;
          const isDefault = setup.name.toLowerCase() === "unknown";
          if (isEditing) {
            return (
              <div
                key={setup.id}
                style={{
                  display: "grid",
                  gap: "0.5rem",
                  borderTop: "1px solid #e6e9f0",
                  padding: "0.5rem 0"
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.5rem" }}>
                  <input
                    className="input"
                    value={editingSetup?.name ?? ""}
                    onChange={(e) =>
                      setEditingSetup((prev) =>
                        prev ? { ...prev, name: e.target.value } : prev
                      )
                    }
                  />
                  <input
                    className="input"
                    type="number"
                    value={editingSetup?.sortOrder ?? ""}
                    onChange={(e) =>
                      setEditingSetup((prev) =>
                        prev
                          ? {
                              ...prev,
                              sortOrder: e.target.value === "" ? undefined : Number(e.target.value)
                            }
                          : prev
                      )
                    }
                  />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      if (!editingSetup || !editingSetup.name.trim()) return;
                      updateSetupMutation.mutate({
                        id: editingSetup.id,
                        name: editingSetup.name,
                        sortOrder: editingSetup.sortOrder
                      });
                    }}
                  >
                    Save
                  </button>
                  <button className="btn secondary" onClick={() => setEditingSetup(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div
              key={setup.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                borderTop: "1px solid #e6e9f0",
                padding: "0.5rem 0",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                <span className="pill">{setup.name}</span>
                <span style={{ opacity: 0.65, fontSize: "0.9rem" }}>Order: {setup.sortOrder ?? 0}</span>
                {isDefault && (
                  <span className="pill" style={{ background: "rgba(16,185,129,0.15)", color: "#34D399" }}>
                    Default
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  className="btn secondary"
                  disabled={isDefault}
                  onClick={() =>
                    setEditingSetup({
                      id: setup.id!,
                      name: setup.name,
                      sortOrder: setup.sortOrder
                    })
                  }
                >
                  Edit
                </button>
                <button
                  className="btn danger"
                  disabled={isDefault}
                  onClick={() => deleteSetupMutation.mutate(setup.id!)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {setups.length === 0 && <div style={{ opacity: 0.7 }}>No setups yet.</div>}
      </div>

      <h2>Tags</h2>
      <div className="card" style={{ maxWidth: 420, marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="input"
            type="color"
            value={form.color}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
          />
          <button
            className="btn"
            onClick={() => createMutation.mutate({ name: form.name, color: form.color })}
          >
            Add tag
          </button>
        </div>
      </div>

      <div className="card">
        {tags?.map((tag) => {
          const isEditing = editing?.id === tag.id;
          return (
            <div
              key={tag.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                borderTop: "1px solid #e6e9f0",
                padding: "0.5rem 0"
              }}
            >
              {isEditing ? (
                <>
                  <input
                    className="input"
                    value={editing?.name ?? ""}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, name: e.target.value } : prev
                      )
                    }
                  />
                  <input
                    className="input"
                    type="color"
                    value={editing?.color ?? "#4F46E5"}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, color: e.target.value } : prev
                      )
                    }
                  />
                  <button
                    className="btn secondary"
                    onClick={() => {
                      if (editing) {
                        updateMutation.mutate(editing);
                        setEditing(null);
                      }
                    }}
                  >
                    Save
                  </button>
                  <button className="btn secondary" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="tag" style={{ background: tag.color ?? "#eef2f8" }}>
                    {tag.name}
                  </span>
                  <button className="btn secondary" onClick={() => setEditing({ id: tag.id!, name: tag.name, color: tag.color })}>
                    Edit
                  </button>
                  <button className="btn danger" onClick={() => deleteMutation.mutate(tag.id!)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <h2 style={{ marginTop: "2rem" }}>Compliance Checklist</h2>
      <p style={{ opacity: 0.75, marginTop: 0 }}>
        Define the checklist items used on the record form. All checkbox items must be checked and setup
        selections must not be "None" for a trade to be marked complied.
      </p>

      <div className="card" style={{ maxWidth: 520, marginBottom: "1rem", display: "grid", gap: "0.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.5rem" }}>
          <label>
            <div>Label</div>
            <input className="input" value={checkLabel} onChange={(e) => setCheckLabel(e.target.value)} />
          </label>
          <label>
            <div>Type</div>
            <select className="select" value={checkType} onChange={(e) => setCheckType(e.target.value as any)}>
              <option value="checkbox">Checkbox</option>
              <option value="setup">Setup (single select)</option>
            </select>
          </label>
        </div>
        {checkType === "setup" && (
          <label>
            <div>Options (one per line)</div>
            <textarea
              className="textarea"
              rows={3}
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
            />
          </label>
        )}
        <button className="btn" type="button" onClick={addCheck} disabled={createCheckMutation.isPending}>
          Add checklist item
        </button>
      </div>

      <div className="card">
        {checks.map((c) => {
          const isEditing = editingCheck?.id === c.id;
          if (isEditing) {
            const ec = editingCheck as NonNullable<typeof editingCheck>;
            return (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gap: "0.5rem",
                  borderTop: "1px solid #e6e9f0",
                  padding: "0.5rem 0"
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.5rem" }}>
                  <input
                    className="input"
                    value={ec.label}
                    onChange={(e) =>
                      setEditingCheck((prev) =>
                        prev ? { ...prev, label: e.target.value } : prev
                      )
                    }
                  />
                  <select
                    className="select"
                    value={ec.type}
                    onChange={(e) =>
                      setEditingCheck((prev) =>
                        prev ? { ...prev, type: e.target.value as any } : prev
                      )
                    }
                  >
                    <option value="checkbox">Checkbox</option>
                    <option value="setup">Setup (single select)</option>
                  </select>
                </div>
                {ec.type === "setup" && (
                  <textarea
                    className="textarea"
                    rows={3}
                    value={ec.optionsText}
                    onChange={(e) =>
                      setEditingCheck((prev) =>
                        prev ? { ...prev, optionsText: e.target.value } : prev
                      )
                    }
                  />
                )}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      if (!editingCheck) return;
                      const options =
                        ec.type === "setup"
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
                    }}
                  >
                    Save
                  </button>
                  <button className="btn secondary" onClick={() => setEditingCheck(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div
              key={c.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0",
                borderTop: "1px solid #e6e9f0"
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{c.label}</div>
                <div style={{ opacity: 0.7, fontSize: "0.9rem" }}>
                  {c.type === "checkbox" ? "Checkbox" : "Setup"}{" "}
                  {c.type === "setup" && c.options?.length
                    ? `• ${c.options.map((o) => o.label).join(", ")}`
                    : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  className="btn secondary"
                  onClick={() =>
                    setEditingCheck({
                      id: c.id!,
                      label: c.label,
                      type: c.type as any,
                      optionsText:
                        c.type === "setup"
                          ? (c.options ?? []).map((o) => o.label).join("\n")
                          : ""
                    })
                  }
                >
                  Edit
                </button>
                <button
                  className="btn danger"
                  onClick={() => deleteCheckMutation.mutate(c.id!)}
                  disabled={deleteCheckMutation.isPending}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {checks.length === 0 && <div style={{ opacity: 0.7 }}>No checklist items yet.</div>}
      </div>
    </div>
  );
}

