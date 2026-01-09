const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";
async function request(path, options = {}) {
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
    return (await res.json());
}
const queryFromFilters = (filters) => {
    const params = new URLSearchParams();
    if (filters.page)
        params.set("page", String(filters.page));
    if (filters.pageSize)
        params.set("pageSize", String(filters.pageSize));
    if (filters.start)
        params.set("start", filters.start);
    if (filters.end)
        params.set("end", filters.end);
    filters.symbols?.forEach((s) => params.append("symbols", s));
    filters.tagIds?.forEach((t) => params.append("tagIds", String(t)));
    filters.accountTypes?.forEach((a) => params.append("accountTypes", a));
    filters.results?.forEach((r) => params.append("results", r));
    if (filters.complied !== undefined)
        params.set("complied", String(filters.complied));
    if (filters.customFieldFilters?.length) {
        params.set("customFieldFilters", JSON.stringify(filters.customFieldFilters));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
};
export const api = {
    async getRecords(filters) {
        const qs = queryFromFilters(filters);
        return request(`/records${qs}`);
    },
    async getRecord(id) {
        return request(`/records/${id}`);
    },
    async createRecord(payload) {
        return request(`/records`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },
    async updateRecord(id, payload) {
        return request(`/records/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },
    async deleteRecords(ids) {
        return request(`/records/bulk/delete`, {
            method: "POST",
            body: JSON.stringify({ ids })
        });
    },
    async bulkUpdateTags(ids, tagIds) {
        return request(`/records/bulk/tags`, {
            method: "POST",
            body: JSON.stringify({ ids, tagIds })
        });
    },
    async listTags() {
        return request(`/tags`);
    },
    async createTag(data) {
        return request(`/tags`, {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    async updateTag(id, data) {
        return request(`/tags/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },
    async deleteTag(id) {
        return request(`/tags/${id}`, {
            method: "DELETE"
        });
    },
    async listCustomFields() {
        return request(`/custom-fields`);
    },
    async createCustomField(data) {
        return request(`/custom-fields`, {
            method: "POST",
            body: JSON.stringify(data)
        });
    },
    async updateCustomField(id, data) {
        return request(`/custom-fields/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },
    async deleteCustomField(id) {
        return request(`/custom-fields/${id}`, {
            method: "DELETE"
        });
    },
    async uploadAttachment(file, recordId) {
        const form = new FormData();
        form.append("file", file);
        if (recordId)
            form.append("recordId", String(recordId));
        const res = await fetch(`${API_BASE}/attachments`, {
            method: "POST",
            body: form
        });
        if (!res.ok) {
            throw new Error(await res.text());
        }
        return (await res.json());
    },
    async analyticsSummary(filters) {
        const qs = queryFromFilters(filters);
        return request(`/analytics/summary${qs}`);
    },
    async analyticsGroupBy(filters, by) {
        const qs = queryFromFilters(filters);
        const connector = qs ? "&" : "?";
        return request(`/analytics/groupBy${qs}${connector}by=${encodeURIComponent(by)}`);
    }
};
export const getAttachmentUrl = (filePath) => {
    if (!filePath)
        return "";
    const base = API_BASE.endsWith("/api")
        ? API_BASE.slice(0, -4)
        : API_BASE.replace(/\/api\/?$/, "");
    return `${base}/uploads/${filePath}`;
};
