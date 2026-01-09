import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { Tag } from "@trading-logger/shared";

export default function SettingsTagsPage() {
  const queryClient = useQueryClient();
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: api.listTags
  });
  const [form, setForm] = useState({ name: "", color: "#4F46E5" });
  const [editing, setEditing] = useState<{ id: number; name: string; color?: string } | null>(null);

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

  return (
    <div>
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
                borderTop: "1px solid rgba(255,255,255,0.08)",
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
                  <span className="tag" style={{ background: tag.color ?? "rgba(255,255,255,0.08)" }}>
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
    </div>
  );
}
