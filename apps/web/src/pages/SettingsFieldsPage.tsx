import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CustomField,
  CustomFieldOption,
  CustomFieldType
} from "@trading-logger/shared";
import { api } from "../api/client";

type FieldForm = {
  key: string;
  label: string;
  type: CustomFieldType;
  isRequired: boolean;
  options: { label: string; value: string }[];
};

const emptyForm = (): FieldForm => ({
  key: "",
  label: "",
  type: "text",
  isRequired: false,
  options: []
});

export default function SettingsFieldsPage() {
  const queryClient = useQueryClient();
  const { data: fields = [] } = useQuery<CustomField[]>({
    queryKey: ["customFields"],
    queryFn: api.listCustomFields
  });
  const [form, setForm] = useState<FieldForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createCustomField(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customFields"] });
      setForm(emptyForm());
    }
  });
  const updateMutation = useMutation({
    mutationFn: (input: { id: number; data: any }) =>
      api.updateCustomField(input.id, input.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customFields"] });
      setEditingId(null);
      setForm(emptyForm());
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCustomField(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customFields"] })
  });

  useEffect(() => {
    if (editingId && fields) {
      const field = fields.find((f) => f.id === editingId);
      if (field) {
        setForm({
          key: field.key,
          label: field.label,
          type: field.type as CustomFieldType,
          isRequired: field.isRequired ?? false,
          options: field.options?.map((o) => ({ label: o.label, value: o.value })) ?? []
        });
      }
    }
  }, [editingId, fields]);

  const submit = () => {
    const payload: any = { ...form };
    if (form.type === "singleSelect" || form.type === "multiSelect") {
      payload.options = form.options.map((o, idx) => ({
        ...o,
        sortOrder: idx
      })) as CustomFieldOption[];
    } else {
      payload.options = [];
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <h2>Custom Fields</h2>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
          <label>
            <div>Key</div>
            <input
              className="input"
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
            />
          </label>
          <label>
            <div>Label</div>
            <input
              className="input"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </label>
          <label>
            <div>Type</div>
            <select
              className="select"
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as CustomFieldType }))
              }
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="singleSelect">Single Select</option>
              <option value="multiSelect">Multi Select</option>
              <option value="date">Date</option>
              <option value="datetime">Datetime</option>
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))}
            />
            <span>Required</span>
          </label>
        </div>

        {(form.type === "singleSelect" || form.type === "multiSelect") && (
          <div style={{ marginTop: "0.5rem" }}>
            <div>Options</div>
            {form.options.map((opt, idx) => (
              <div key={idx} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <input
                  className="input"
                  placeholder="Label"
                  value={opt.label}
                  onChange={(e) =>
                    setForm((f) => {
                      const opts = [...f.options];
                      opts[idx] = { ...opts[idx], label: e.target.value };
                      return { ...f, options: opts };
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Value"
                  value={opt.value}
                  onChange={(e) =>
                    setForm((f) => {
                      const opts = [...f.options];
                      opts[idx] = { ...opts[idx], value: e.target.value };
                      return { ...f, options: opts };
                    })
                  }
                />
                <button
                  className="btn secondary"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      options: f.options.filter((_, i) => i !== idx)
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="btn secondary"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  options: [...f.options, { label: "", value: "" }]
                }))
              }
            >
              Add option
            </button>
          </div>
        )}

        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
          <button className="btn" onClick={submit}>
            {editingId ? "Update field" : "Create field"}
          </button>
          {editingId && (
            <button
              className="btn secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {fields?.map((field) => (
          <div
            key={field.id}
            style={{
              borderTop: "1px solid #e6e9f0",
              padding: "0.5rem 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{field.label}</div>
              <div style={{ opacity: 0.7, fontSize: "0.9rem" }}>
                {field.key} Â· {field.type} {field.isRequired ? "Â· required" : ""}
              </div>
              {field.options && field.options.length > 0 && (
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  {field.options.map((opt) => (
                    <span key={opt.value} className="tag">
                      {opt.label} ({opt.value})
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button
                className="btn secondary"
                onClick={() => setEditingId(field.id!)}
              >
                Edit
              </button>
              <button className="btn danger" onClick={() => deleteMutation.mutate(field.id!)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

