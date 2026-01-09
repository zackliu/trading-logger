import {
  AnalyticsSummary,
  BreakdownRow,
  CustomField,
  RecordFilters,
  RecordInput,
  RecordUpdate,
  RecordWithRelations,
  Tag,
  PaginatedRecords,
  ComplianceCheck
} from "@trading-logger/shared";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as T;
}

const queryFromFilters = (filters: Partial<RecordFilters>) => {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  filters.symbols?.forEach((s) => params.append("symbols", s));
  filters.tagIds?.forEach((t) => params.append("tagIds", String(t)));
  filters.accountTypes?.forEach((a) => params.append("accountTypes", a));
  filters.results?.forEach((r) => params.append("results", r));
  filters.entryEmotion?.forEach((e) => params.append("entryEmotion", e));
  filters.exitEmotion?.forEach((e) => params.append("exitEmotion", e));
  if (filters.complied !== undefined)
    params.set("complied", String(filters.complied));
  if (filters.customFieldFilters?.length) {
    params.set(
      "customFieldFilters",
      JSON.stringify(filters.customFieldFilters)
    );
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const api = {
  async getRecords(filters: Partial<RecordFilters>) {
    const qs = queryFromFilters(filters);
    return request<PaginatedRecords>(`/records${qs}`);
  },
  async getRecord(id: number) {
    return request<RecordWithRelations>(`/records/${id}`);
  },
  async createRecord(payload: RecordInput) {
    return request<RecordWithRelations>(`/records`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async updateRecord(id: number, payload: RecordUpdate) {
    return request<RecordWithRelations>(`/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  async deleteRecords(ids: number[]) {
    return request<{ success: boolean }>(`/records/bulk/delete`, {
      method: "POST",
      body: JSON.stringify({ ids })
    });
  },
  async bulkUpdateTags(ids: number[], tagIds: number[]) {
    return request<{ success: boolean }>(`/records/bulk/tags`, {
      method: "POST",
      body: JSON.stringify({ ids, tagIds })
    });
  },
  async listTags() {
    return request<Tag[]>(`/tags`);
  },
  async createTag(data: Pick<Tag, "name" | "color">) {
    return request<Tag>(`/tags`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  async updateTag(id: number, data: Partial<Tag>) {
    return request<Tag>(`/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },
  async deleteTag(id: number) {
    return request<{ success: boolean }>(`/tags/${id}`, {
      method: "DELETE"
    });
  },
  async listCustomFields() {
    return request<CustomField[]>(`/custom-fields`);
  },
  async createCustomField(data: any) {
    return request<CustomField>(`/custom-fields`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  async updateCustomField(id: number, data: any) {
    return request<{ success: boolean }>(`/custom-fields/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },
  async deleteCustomField(id: number) {
    return request<{ success: boolean }>(`/custom-fields/${id}`, {
      method: "DELETE"
    });
  },
  async uploadAttachment(file: File, recordId?: number) {
    const form = new FormData();
    form.append("file", file);
    if (recordId) form.append("recordId", String(recordId));
    const res = await fetch(`${API_BASE}/attachments`, {
      method: "POST",
      body: form
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return (await res.json()) as {
      id: number;
      filePath: string;
      mime: string;
      sizeBytes?: number;
      recordId?: number;
    };
  },
  async analyticsSummary(filters: Partial<RecordFilters>) {
    const qs = queryFromFilters(filters);
    return request<AnalyticsSummary>(`/analytics/summary${qs}`);
  },
  async analyticsGroupBy(filters: Partial<RecordFilters>, by: string) {
    const qs = queryFromFilters(filters);
    const connector = qs ? "&" : "?";
    return request<BreakdownRow[]>(
      `/analytics/groupBy${qs}${connector}by=${encodeURIComponent(by)}`
    );
  },
  async listComplianceChecks() {
    return request<ComplianceCheck[]>(`/compliance-checks`);
  },
  async createComplianceCheck(data: any) {
    return request<ComplianceCheck>(`/compliance-checks`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  async updateComplianceCheck(id: number, data: any) {
    return request<{ success: boolean }>(`/compliance-checks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },
  async deleteComplianceCheck(id: number) {
    return request<{ success: boolean }>(`/compliance-checks/${id}`, {
      method: "DELETE"
    });
  }
};

export const getAttachmentUrl = (filePath?: string) => {
  if (!filePath) return "";
  const base = API_BASE.endsWith("/api")
    ? API_BASE.slice(0, -4)
    : API_BASE.replace(/\/api\/?$/, "");
  return `${base}/uploads/${filePath}`;
};
