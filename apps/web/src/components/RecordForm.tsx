import {
  AccountType,
  CustomField,
  CustomFieldValue,
  RecordInput,
  RecordWithRelations,
  ResultType,
  Tag
} from "@trading-logger/shared";
import { useEffect, useMemo, useState } from "react";
import { api, getAttachmentUrl } from "../api/client";
import { toInputDateTime, toIsoFromLocal } from "../utils/format";
import clsx from "clsx";

type Props = {
  initial?: RecordWithRelations | null;
  tags: Tag[];
  customFields: CustomField[];
  onSaved: (record: RecordInput) => Promise<void>;
  onCancel?: () => void;
};

type CustomValueMap = Record<number, CustomFieldValue>;

const defaultState = (): RecordInput => ({
  datetime: new Date().toISOString(),
  symbol: "",
  accountType: "sim",
  result: "takeProfit",
  rMultiple: null,
  complied: false,
  notes: "",
  tagIds: [],
  customValues: [],
  attachmentIds: []
});

export default function RecordForm({
  initial,
  tags,
  customFields,
  onSaved,
  onCancel
}: Props) {
  const [state, setState] = useState<RecordInput>(() =>
    initial
      ? {
          datetime: initial.datetime,
          symbol: initial.symbol,
          accountType: initial.accountType,
          result: initial.result,
          rMultiple: initial.rMultiple ?? null,
          complied: initial.complied,
          notes: initial.notes ?? "",
          tagIds: initial.tags.map((t) => t.id!) ?? [],
          customValues: [],
          attachmentIds: initial.attachments.map((a) => a.id!).filter(Boolean)
        }
      : defaultState()
  );
  const [customValueMap, setCustomValueMap] = useState<CustomValueMap>(() => {
    const map: CustomValueMap = {};
    initial?.customValues.forEach((cv) => {
      map[cv.fieldId] = cv;
    });
    return map;
  });
  const [uploading, setUploading] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | undefined>(
    initial?.attachments[0]?.filePath
      ? getAttachmentUrl(initial.attachments[0].filePath)
      : undefined
  );
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (initial) {
      setState((prev) => ({
        ...prev,
        attachmentIds: initial.attachments.map((a) => a.id!).filter(Boolean)
      }));
      setAttachmentPreview(
        initial.attachments[0]?.filePath
          ? getAttachmentUrl(initial.attachments[0].filePath)
          : undefined
      );
    }
  }, [initial]);

  useEffect(() => {
    if (!initial) {
      setState(defaultState());
      setCustomValueMap({});
      setAttachmentPreview(undefined);
    }
  }, [initial?.id]);

  const setField = <K extends keyof RecordInput>(key: K, value: RecordInput[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const handleCustomValue = (field: CustomField, value: any) => {
    setCustomValueMap((prev) => ({
      ...prev,
      [field.id!]: {
        fieldId: field.id!,
        type: field.type as any,
        ...(field.type === "multiSelect"
          ? { values: value as string[] }
          : { value })
      } as CustomFieldValue
    }));
  };

  const payload = useMemo<RecordInput>(() => {
    return {
      ...state,
      customValues: Object.values(customValueMap)
    };
  }, [state, customValueMap]);

  const onSubmit = async (e: React.FormEvent) => {
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

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await api.uploadAttachment(file, initial?.id);
      setState((prev) => ({
        ...prev,
        attachmentIds: [res.id]
      }));
      setAttachmentPreview(getAttachmentUrl(res.filePath));
    } finally {
      setUploading(false);
    }
  };

  const tryHandleFile = (file?: File | null) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return;
    uploadFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/")
    );
    if (item) {
      const file = item.getAsFile();
      tryHandleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    tryHandleFile(file);
  };

  return (
    <form className="card" onSubmit={onSubmit} style={{ marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 220px" }}>
          <div>Date & Time</div>
          <input
            className="input"
            type="datetime-local"
            value={toInputDateTime(state.datetime)}
            onChange={(e) => setField("datetime", e.target.value)}
          />
        </label>
        <label style={{ flex: "1 1 160px" }}>
          <div>Symbol</div>
          <input
            className="input"
            value={state.symbol}
            onChange={(e) => setField("symbol", e.target.value)}
            placeholder="AAPL, BTCUSDT..."
          />
        </label>
        <label style={{ flex: "1 1 160px" }}>
          <div>Account</div>
          <select
            className="select"
            value={state.accountType}
            onChange={(e) => setField("accountType", e.target.value as AccountType)}
          >
            <option value="live">Live</option>
            <option value="sim">Sim</option>
          </select>
        </label>
        <label style={{ flex: "1 1 160px" }}>
          <div>Result</div>
          <select
            className="select"
            value={state.result}
            onChange={(e) => setField("result", e.target.value as ResultType)}
          >
            <option value="takeProfit">Take Profit</option>
            <option value="stopLoss">Stop Loss</option>
            <option value="breakeven">Breakeven</option>
            <option value="manualExit">Manual Exit</option>
          </select>
        </label>
      </div>

      <div
        style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "0.75rem",
      marginTop: "0.75rem"
    }}
  >
        <label>
          <div>R Multiple</div>
          <input
            className="input"
            type="number"
            value={state.rMultiple ?? ""}
            onChange={(e) =>
              setField(
                "rMultiple",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={state.complied}
            onChange={(e) => setField("complied", e.target.checked)}
          />
          <span>Complied with rules</span>
        </label>
      </div>

      <div style={{ marginTop: "0.75rem" }}>
        <div>Tags</div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {tags.map((tag) => {
            const checked = state.tagIds.includes(tag.id!);
            return (
              <label
                key={tag.id}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: "999px",
                  border: `1px solid ${
                    checked ? "rgba(79,70,229,0.6)" : "rgba(255,255,255,0.1)"
                  }`,
                  cursor: "pointer",
                  background: checked ? "rgba(79,70,229,0.15)" : "transparent"
                }}
              >
                <input
                  type="checkbox"
                  style={{ marginRight: "0.3rem" }}
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...state.tagIds, tag.id!]
                      : state.tagIds.filter((t) => t !== tag.id);
                    setField("tagIds", next);
                  }}
                />
                {tag.name}
              </label>
            );
          })}
        </div>
      </div>

      {customFields.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ marginBottom: "0.35rem" }}>Custom Fields</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.75rem"
            }}
          >
            {customFields.map((field) => {
              const current = customValueMap[field.id!] as any;
              if (field.type === "boolean") {
                return (
                  <label key={field.id} style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="checkbox"
                      checked={current?.value ?? false}
                      onChange={(e) => handleCustomValue(field, e.target.checked)}
                    />
                    <span>{field.label}</span>
                  </label>
                );
              }
              if (field.type === "singleSelect") {
                return (
                  <label key={field.id}>
                    <div>{field.label}</div>
                    <select
                      className="select"
                      value={current?.value ?? ""}
                      onChange={(e) => handleCustomValue(field, e.target.value)}
                    >
                      <option value="">Select</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }
              if (field.type === "multiSelect") {
                const values: string[] = current?.values ?? [];
                return (
                  <div key={field.id}>
                    <div>{field.label}</div>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {field.options?.map((opt) => {
                        const checked = values.includes(opt.value);
                        return (
                          <label key={opt.value}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...values, opt.value]
                                  : values.filter((v) => v !== opt.value);
                                handleCustomValue(field, next);
                              }}
                            />{" "}
                            {opt.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              if (field.type === "number") {
                return (
                  <label key={field.id}>
                    <div>{field.label}</div>
                    <input
                      className="input"
                      type="number"
                      value={current?.value ?? ""}
                      onChange={(e) =>
                        handleCustomValue(
                          field,
                          e.target.value === "" ? undefined : Number(e.target.value)
                        )
                      }
                    />
                  </label>
                );
              }
              if (field.type === "date") {
                return (
                  <label key={field.id}>
                    <div>{field.label}</div>
                    <input
                      className="input"
                      type="date"
                      value={current?.value ?? ""}
                      onChange={(e) => handleCustomValue(field, e.target.value)}
                    />
                  </label>
                );
              }
              if (field.type === "datetime") {
                return (
                  <label key={field.id}>
                    <div>{field.label}</div>
                    <input
                      className="input"
                      type="datetime-local"
                      value={current?.value ? toInputDateTime(current.value) : ""}
                      onChange={(e) => handleCustomValue(field, e.target.value)}
                    />
                  </label>
                );
              }
              return (
                <label key={field.id}>
                  <div>{field.label}</div>
                  <input
                    className="input"
                    value={current?.value ?? ""}
                    onChange={(e) => handleCustomValue(field, e.target.value)}
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: "0.75rem" }}>
        <div>Notes</div>
        <textarea
          className="textarea"
          rows={3}
          value={state.notes}
          onChange={(e) => setField("notes", e.target.value)}
          onPaste={handlePaste}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={dragging ? { outline: "2px dashed rgba(124,58,237,0.5)" } : undefined}
        />
      </div>

      <div
        style={{
          marginTop: "0.75rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <label className={clsx("btn", "secondary")} style={{ cursor: "pointer" }}>
          {uploading ? "Uploading..." : "Upload Image"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
          />
        </label>

        {attachmentPreview && (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={attachmentPreview}
              alt="attachment"
              style={{ height: 80, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <button
              type="button"
              onClick={() => {
                setAttachmentPreview(undefined);
                setState((prev) => ({ ...prev, attachmentIds: [] }));
              }}
              style={{
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
              }}
              aria-label="Remove attachment"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <button className="btn" type="submit">
          Save
        </button>
        {onCancel && (
          <button className="btn secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
