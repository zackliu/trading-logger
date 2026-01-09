import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { api, getAttachmentUrl } from "../api/client";
import { formatDateTime } from "../utils/format";
import { RecordWithRelations, CustomField } from "@trading-logger/shared";

export default function RecordDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const id = Number(params.id);
  const { data, isLoading, isError } = useQuery<RecordWithRelations>({
    queryKey: ["record", id],
    queryFn: () => api.getRecord(id),
    enabled: Number.isFinite(id)
  });
  const { data: customFields = [] } = useQuery<CustomField[]>({
    queryKey: ["customFields"],
    queryFn: api.listCustomFields
  });

  const fieldMap = useMemo(() => {
    const map = new Map<number, string>();
    customFields?.forEach((f) => map.set(f.id!, f.label));
    return map;
  }, [customFields]);

  if (isLoading) return <div>Loading...</div>;
  if (isError || !data) return <div>Record not found.</div>;

  return (
    <div className="card">
      <button className="btn secondary" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h2 style={{ marginBottom: "0.25rem" }}>{data.symbol}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
        <Detail label="Datetime" value={formatDateTime(data.datetime)} />
        <Detail label="Account" value={data.accountType} />
        <Detail label="Result" value={data.result} />
        <Detail label="R Multiple" value={data.rMultiple ?? "-"} />
        <Detail label="Complied" value={data.complied ? "Yes" : "No"} />
      </div>

      <div style={{ marginTop: "0.75rem" }}>
        <strong>Tags:</strong>{" "}
        {data.tags.map((t) => (
          <span key={t.id} className="tag" style={{ marginRight: "0.3rem" }}>
            {t.name}
          </span>
        ))}
      </div>

      {data.customValues.length > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          <strong>Custom Fields</strong>
          <ul>
            {data.customValues.map((cv) => (
              <li key={`${cv.fieldId}-${cv.type}`}>
                <strong>{fieldMap.get(cv.fieldId) ?? cv.fieldId}:</strong>{" "}
                {"value" in cv
                  ? (cv as any).value?.toString()
                  : (cv as any).values?.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: "0.75rem" }}>
        <strong>Notes</strong>
        <p style={{ whiteSpace: "pre-wrap" }}>{data.notes}</p>
      </div>

      {data.attachments.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {data.attachments.map((att) => (
            <img
              key={att.id}
              src={getAttachmentUrl(att.filePath)}
              alt="attachment"
              style={{ width: 220, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.55rem 0.7rem", borderRadius: 10 }}>
      <div style={{ opacity: 0.7, fontSize: "0.85rem" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
