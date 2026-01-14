import {
  AccountType,
  CustomField,
  CustomFieldValue,
  ComplianceCheck,
  ComplianceSelection,
  RecordInput,
  RecordWithRelations,
  ResultType,
  Tag,
  Setup
} from "@trading-logger/shared";
import { useEffect, useMemo, useState } from "react";
import { api, getAttachmentUrl } from "../api/client";
import { toInputDateTime, toIsoFromLocal } from "../utils/format";
import clsx from "clsx";

type Props = {
  initial?: RecordWithRelations | null;
  tags: Tag[];
  setups: Setup[];
  customFields: CustomField[];
  complianceChecks: ComplianceCheck[];
  onSaved: (record: RecordInput) => Promise<void>;
  onCancel?: () => void;
};

type CustomValueMap = Record<number, CustomFieldValue>;

const defaultState = (setupId: number): RecordInput => ({
  datetime: new Date().toISOString(),
  symbol: "",
  setupId,
  accountType: "sim",
  result: "takeProfit",
  rMultiple: null,
  complied: false,
  notes: "",
  tagIds: [],
  customValues: [],
  attachmentIds: [],
  complianceSelections: []
});

export default function RecordForm({
  initial,
  tags,
  setups,
  customFields,
  complianceChecks,
  onSaved,
  onCancel
}: Props) {
  const defaultSetupId = useMemo(() => {
    if (!setups?.length) return 1;
    const unknown = setups.find(
      (s) => s.name.toLowerCase() === "unknown"
    );
    return unknown?.id ?? setups[0].id ?? 1;
  }, [setups]);
  const [state, setState] = useState<RecordInput>(() =>
    initial
      ? {
          datetime: initial.datetime,
          symbol: initial.symbol,
          setupId: initial.setupId,
          accountType: initial.accountType,
          result: initial.result,
          rMultiple: initial.rMultiple ?? null,
          complied: initial.complied,
          notes: initial.notes ?? "",
          tagIds: initial.tags.map((t) => t.id!) ?? [],
          customValues: [],
          attachmentIds: initial.attachments.map((a) => a.id!).filter(Boolean),
          complianceSelections: initial.complianceSelections ?? []
        }
      : defaultState(defaultSetupId)
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
  const [complianceSelections, setComplianceSelections] = useState<ComplianceSelection[]>(
    initial?.complianceSelections ?? []
  );
  const [showRCalc, setShowRCalc] = useState(false);
  const [calcStopSize, setCalcStopSize] = useState<string>("");
  const [calcPl, setCalcPl] = useState<string>("");
  const derivedRFromCalc = useMemo(() => {
    const stop = Number(calcStopSize);
    const pnl = Number(calcPl);
    if (!Number.isFinite(stop) || !Number.isFinite(pnl) || stop === 0) return null;
    return Number((pnl / stop).toFixed(2));
  }, [calcStopSize, calcPl]);
  const emotions = [
    {
      value: "fear",
      label: "恐惧/焦虑",
      hint:
        "避免痛苦：过度保守或防御，不敢按计划进/稍回撤就跑/加仓求确定性。自检：我是不是只想赶紧确定结果、频繁刷新价格求安全感？"
    },
    {
      value: "greed",
      label: "贪婪/兴奋",
      hint:
        "追求快感：放大胜率、缩小风险感，追涨杀跌、扩大仓位。自检：我是不是已经把盈利花掉了，或觉得这波不一样？"
    },
    {
      value: "anger",
      label: "愤怒/报复",
      hint:
        "恢复尊严：把市场当对手，想扳回来导致频率变高标准变松。自检：我是不是在想“凭什么刚才打我止损”？"
    },
    {
      value: "overconfidence",
      label: "自负/亢奋",
      hint:
        "掌控一切：忽略反例，连赢后加杠杆或跳过检查。自检：我是不是觉得自己状态太好，不需要那么多规矩？"
    },
    {
      value: "regret",
      label: "懊悔/错过恐惧",
      hint:
        "补一口气：错过或卖飞后急着重进，条件不完整也上。自检：如果这单不做我会不会强烈不舒服，我主要在看走了多少吗？"
    },
    {
      value: "hope",
      label: "希望/否认",
      hint:
        "推迟承认错误：扛单、挪止损、等反弹。自检：我是不是在等一个小反弹让我好受一点，或不愿按规则出场？"
    },
    {
      value: "boredom",
      label: "无聊/寻刺激",
      hint:
        "找事情做：过度交易，把无优势的波动当机会。自检：我是不是因为没单可做而焦躁，在随便找理由下单？"
    },
    {
      value: "fatigue",
      label: "疲劳/麻木",
      hint:
        "注意力下降：漏看信息、反应慢、执行粗糙或摆烂。自检：我是不是看图看不进去，对风险提示无感？"
    },
    {
      value: "confusion",
      label: "困惑/信息过载",
      hint:
        "找确定性但找不到：加指标、换周期、改假设，最后随机动作。自检：我能一句话说清逻辑吗？说不清通常就是困惑。"
    },
    {
      value: "calm",
      label: "平静/专注",
      hint:
        "情绪不主导动作：接受不确定，能按规则做也能按规则不做。自检：不触发能否轻松走开，触发止损能否平静执行？"
    }
  ];
  const derivedComplied = useMemo(() => {
    if (!complianceChecks.length) return state.complied;
    for (const check of complianceChecks) {
      const sel = complianceSelections.find((s) => s.checkId === check.id);
      if (check.type === "checkbox") {
        if (!sel || sel.type !== "checkbox" || !sel.checked) return false;
      } else {
        if (!sel || sel.type !== "setup" || sel.optionId === null) return false;
      }
    }
    return true;
  }, [complianceChecks, complianceSelections, state.complied]);

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
      setState(defaultState(defaultSetupId));
      setCustomValueMap({});
      setAttachmentPreview(undefined);
      setComplianceSelections([]);
    }
  }, [initial?.id, defaultSetupId]);

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
      customValues: Object.values(customValueMap),
      complianceSelections
    };
  }, [state, customValueMap, complianceSelections]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".r-calc-popover") && !target.closest(".r-calc-trigger")) {
        setShowRCalc(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaved({
      ...payload,
      complied: derivedComplied,
      datetime: toIsoFromLocal(payload.datetime)
    });
    if (!initial) {
      setState(defaultState(defaultSetupId));
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
        <label style={{ flex: "1 1 180px" }}>
          <div>Setup</div>
          <select
            className="select"
            value={state.setupId}
            onChange={(e) => setField("setupId", Number(e.target.value))}
          >
            {setups.length === 0 && <option value={state.setupId}>Unknown</option>}
            {setups.map((setup) => (
              <option key={setup.id} value={setup.id}>
                {setup.name}
              </option>
            ))}
          </select>
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
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem",
          marginTop: "0.75rem",
          alignItems: "end"
        }}
      >
        <label>
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
        <label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.35rem"
            }}
          >
            <span>R Multiple</span>
            <button
              type="button"
              onClick={() => setShowRCalc((v) => !v)}
              className="r-calc-trigger"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "1px solid #d5dbe7",
                background: "#f7f8fb",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                color: "#0b1d32"
              }}
              aria-label="Open R calculator"
            >
              🧮
            </button>
          </div>
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
        {showRCalc && (
          <div
            className="r-calc-popover"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 60,
              padding: "1rem"
            }}
          >
            <div
              style={{
                width: 320,
                background: "white",
                border: "1px solid #e6e9f0",
                borderRadius: 14,
                padding: "0.9rem",
                boxShadow: "0 22px 48px rgba(17,24,39,0.22)",
                display: "grid",
                gap: "0.6rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700 }}>R 计算器</div>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowRCalc(false)}
                  style={{ padding: "0.3rem 0.6rem" }}
                >
                  关闭
                </button>
              </div>
              <label style={{ fontSize: "0.95rem", color: "#475569" }}>
                <div>止损大小</div>
                <input
                  className="input"
                  type="number"
                  value={calcStopSize}
                  onChange={(e) => setCalcStopSize(e.target.value)}
                  placeholder="例如 100"
                />
              </label>
              <label style={{ fontSize: "0.95rem", color: "#475569" }}>
                <div>实际盈亏</div>
                <input
                  className="input"
                  type="number"
                  value={calcPl}
                  onChange={(e) => setCalcPl(e.target.value)}
                  placeholder="可填正负数"
                />
              </label>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>R = {derivedRFromCalc ?? "--"}</div>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      setCalcStopSize("");
                      setCalcPl("");
                      setShowRCalc(false);
                    }}
                  >
                    清空
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={derivedRFromCalc === null}
                    onClick={() => {
                      if (derivedRFromCalc !== null) {
                        setField("rMultiple", derivedRFromCalc);
                        setCalcStopSize("");
                        setCalcPl("");
                        setShowRCalc(false);
                      }
                    }}
                  >
                    应用
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ opacity: 0.7 }}>Complied</span>
          <span className="pill" style={{ background: derivedComplied ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)", color: derivedComplied ? "#34D399" : "#F87171" }}>
            {derivedComplied ? "Yes" : "No"}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem",
          marginTop: "0.5rem"
        }}
      >
        <label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span>Entry Emotion</span>
            <span title="入场时的情绪，悬停选项可读解释">?</span>
          </div>
          <select
            className="select"
            value={state.entryEmotion ?? ""}
            onChange={(e) =>
              setField(
                "entryEmotion",
                (e.target.value || undefined) as (typeof state.entryEmotion)
              )
            }
          >
            <option value="">None</option>
            {emotions.map((opt) => (
              <option key={opt.value} value={opt.value} title={opt.hint}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span>Exit Emotion</span>
            <span title="离场时的情绪，悬停选项可读解释">?</span>
          </div>
          <select
            className="select"
            value={state.exitEmotion ?? ""}
            onChange={(e) =>
              setField(
                "exitEmotion",
                (e.target.value || undefined) as (typeof state.exitEmotion)
              )
            }
          >
            <option value="">None</option>
            {emotions.map((opt) => (
              <option key={opt.value} value={opt.value} title={opt.hint}>
                {opt.label}
              </option>
            ))}
          </select>
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
                    checked ? "rgba(0,113,227,0.55)" : "#d5dbe7"
                  }`,
                  cursor: "pointer",
                  background: checked ? "rgba(0,113,227,0.1)" : "transparent"
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

      {complianceChecks.length > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          <div style={{ marginBottom: "0.35rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Compliance Checklist</span>
            <span className="pill" style={{ background: derivedComplied ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)", color: derivedComplied ? "#34D399" : "#F87171" }}>
              {derivedComplied ? "Complied" : "Incomplete"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "0.65rem" }}>
            {complianceChecks.map((check) => {
              if (check.type === "checkbox") {
                const sel = complianceSelections.find(
                  (s) => s.checkId === check.id && s.type === "checkbox"
                ) as any;
                return (
                  <label key={check.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={!!sel?.checked}
                      onChange={(e) => {
                        const next = complianceSelections.filter((s) => s.checkId !== check.id);
                        setComplianceSelections([
                          ...next,
                          { type: "checkbox", checkId: check.id!, checked: e.target.checked }
                        ]);
                      }}
                    />
                    <span>{check.label}</span>
                  </label>
                );
              }
              const sel = complianceSelections.find(
                (s) => s.checkId === check.id && s.type === "setup"
              ) as any;
              return (
                <label key={check.id}>
                  <div>{check.label}</div>
                  <select
                    className="select"
                    value={sel?.optionId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const next = complianceSelections.filter((s) => s.checkId !== check.id);
                      setComplianceSelections([
                        ...next,
                        {
                          type: "setup",
                          checkId: check.id!,
                          optionId: val === "" ? null : Number(val)
                        }
                      ]);
                    }}
                  >
                    <option value="">None</option>
                    {check.options?.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        </div>
      )}

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
                    style={{ height: 80, borderRadius: 12, border: "1px solid #e6e9f0" }}
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
              Ã—
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



