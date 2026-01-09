import dayjs from "dayjs";

export const formatDateTime = (value?: string) =>
  value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";

export const toInputDateTime = (value?: string) =>
  value ? dayjs(value).format("YYYY-MM-DDTHH:mm") : "";

export const toIsoFromLocal = (value: string) =>
  value ? dayjs(value).toDate().toISOString() : "";
