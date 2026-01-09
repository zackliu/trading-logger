import { RecordWithRelations } from "@trading-logger/shared";
import { useEffect, useRef, useState } from "react";
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
  const attachment = record.attachments?.[0];
  const preview = attachment ? getAttachmentUrl(attachment.filePath) : null;
  const pnlColor =
    record.pnl > 0 ? "#10B981" : record.pnl < 0 ? "#EF4444" : "#E5ECFF";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
          <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{record.symbol}</div>
          <div style={{ opacity: 0.75, fontSize: "0.9rem" }}>
            {formatDateTime(record.datetime)} · {record.accountType}
          </div>
          <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", marginTop: "0.4rem", flexWrap: "wrap" }}>
            <span className="pill" style={{ background: "rgba(124, 58, 237, 0.15)", color: "#C4B5FD" }}>
              {resultLabels[record.result] ?? record.result}
            </span>
            <span className="pill" style={{ background: pnlColor + "20", color: pnlColor }}>
              PNL {record.pnl}
            </span>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.4rem" }}>
        <Metric label="Risk" value={record.riskAmount} />
        <Metric label="R Multiple" value={record.rMultiple ?? "-"} />
      </div>

      {record.tags?.length > 0 && (
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {record.tags.map((tag) => (
            <span key={tag.id} className="tag">
              {tag.name}
            </span>
          ))}
        </div>
      )}

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

      {preview && (
        <img
          src={preview}
          alt={`${record.symbol} attachment`}
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            objectFit: "cover",
            maxHeight: 240
          }}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 10,
        padding: "0.55rem 0.65rem"
      }}
    >
      <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}
