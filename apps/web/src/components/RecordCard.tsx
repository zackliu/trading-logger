import { RecordWithRelations } from "@trading-logger/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getAttachmentUrl } from "../api/client";
import { formatDateTime } from "../utils/format";

type Props = {
  record: RecordWithRelations;
  onEdit: (record: RecordWithRelations) => void;
  onDelete: (id: number) => void;
};

const resultLabels: Record<string, string> = {
  takeProfit: "Take Profit",
  stopLoss: "Stop Loss",
  breakeven: "Breakeven",
  manualExit: "Manual Exit"
};

export default function RecordCard({ record, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const attachments = useMemo(() => {
    return [...(record.attachments ?? [])].sort((a, b) => {
      if (a.createdAt && b.createdAt) return a.createdAt.localeCompare(b.createdAt);
      if (a.id && b.id) return a.id - b.id;
      return 0;
    });
  }, [record.attachments]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const lightbox =
    lightboxSrc &&
    createPortal(
      <div
        onClick={() => setLightboxSrc(null)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 4000,
          padding: "2.5rem"
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            maxWidth: "min(1600px, 96vw)",
            maxHeight: "96vh"
          }}
        >
          <img
            src={lightboxSrc}
            alt="attachment full"
            style={{
              maxWidth: "min(1600px, 96vw)",
              maxHeight: "96vh",
              borderRadius: 14,
              objectFit: "contain",
              boxShadow: "0 36px 90px rgba(0,0,0,0.5)"
            }}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            style={{
              position: "absolute",
              top: -14,
              right: -14,
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.82)",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              boxShadow: "0 12px 34px rgba(0,0,0,0.35)"
            }}
            aria-label="Close image"
          >
            ×
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <div
      className="card"
      style={{
        padding: "0.95rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
        borderRadius: 16
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.75rem",
          alignItems: "flex-start"
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{record.setup?.name ?? "Unknown"}</div>
          <div style={{ opacity: 0.75, fontSize: "0.9rem" }}>
            {record.symbol} · {formatDateTime(record.datetime)} · {record.accountType}
          </div>
          <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", marginTop: "0.4rem", flexWrap: "wrap" }}>
            <span className="pill" style={{ background: "rgba(124, 58, 237, 0.15)", color: "#C4B5FD" }}>
              {resultLabels[record.result] ?? record.result}
            </span>
            {record.tags?.map((tag) => (
              <span
                key={tag.id}
                className="pill"
                style={{
                  background: tag.color ?? "rgba(0,0,0,0.06)",
                  color: tag.color ? "#0b1d32" : "#0b1d32"
                }}
              >
                {tag.name}
              </span>
            ))}
            {record.complied && (
              <span className="pill" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34D399" }}>
                Complied
              </span>
            )}
          </div>
        </div>
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            className="menu-button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="Record actions"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="menu">
              <button
                className="menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(record);
                }}
              >
                Edit
              </button>
              <button
                className="menu-item danger"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(record.id!);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.4rem" }}>
        <Metric label="R Multiple" value={record.rMultiple ?? "-"} />
      </div>

      {record.notes && (
        <p
          style={{
            margin: 0,
            opacity: 0.9,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            maxHeight: 120,
            overflow: "hidden"
          }}
        >
          {record.notes}
        </p>
      )}

      {attachments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {attachments.map((att) => {
            const src = getAttachmentUrl(att.filePath);
            return (
              <div key={att.id} style={{ position: "relative" }}>
                <img
                  src={src}
                  alt="attachment"
                  onClick={() => setLightboxSrc(src)}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 12,
                    border: "1px solid #e6e9f0",
                    cursor: "zoom-in",
                    background: "#f7f8fb",
                    objectFit: "contain"
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {lightbox}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div
      style={{
        background: "#f7f8fb",
        border: "1px solid #e6e9f0",
        borderRadius: 10,
        padding: "0.55rem 0.65rem"
      }}
    >
      <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}
