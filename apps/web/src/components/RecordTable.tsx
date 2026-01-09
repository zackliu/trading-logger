import { RecordWithRelations } from "@trading-logger/shared";
import { formatDateTime } from "../utils/format";

type Props = {
  records: RecordWithRelations[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onOpen: (id: number) => void;
};

const badge = (label: string, tone: string) => (
  <span
    style={{
      padding: "0.2rem 0.55rem",
      borderRadius: 999,
      fontSize: "0.8rem",
      background: tone
    }}
  >
    {label}
  </span>
);

export default function RecordTable({
  records,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpen
}: Props) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", fontSize: "0.9rem" }}>
            <th>
              <input
                type="checkbox"
                checked={selectedIds.length === records.length && records.length > 0}
                onChange={onSelectAll}
              />
            </th>
            <th>Date</th>
            <th>Symbol</th>
            <th>Account</th>
            <th>Result</th>
            <th>R</th>
            <th>Complied</th>
            <th>Tags</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr
              key={r.id}
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer"
              }}
              onClick={() => onOpen(r.id!)}
            >
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(r.id!)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect(r.id!);
                  }}
                />
              </td>
              <td>{formatDateTime(r.datetime)}</td>
              <td>{r.symbol}</td>
              <td>{r.accountType}</td>
              <td>{r.result}</td>
              <td>{r.rMultiple ?? "-"}</td>
              <td>{badge(r.complied ? "Yes" : "No", r.complied ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)")}</td>
              <td>
                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                  {r.tags.map((t) => (
                    <span key={t.id} className="tag">
                      {t.name}
                    </span>
                  ))}
                </div>
              </td>
              <td style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
