import dayjs from "dayjs";
export const formatDateTime = (value) => value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "";
export const toInputDateTime = (value) => value ? dayjs(value).format("YYYY-MM-DDTHH:mm") : "";
export const toIsoFromLocal = (value) => value ? dayjs(value).toDate().toISOString() : "";
