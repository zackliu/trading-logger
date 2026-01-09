import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Route, Routes } from "react-router-dom";
import RecordsPage from "./pages/RecordsPage";
import RecordDetailPage from "./pages/RecordDetailPage";
import SettingsTagsPage from "./pages/SettingsTagsPage";
import SettingsFieldsPage from "./pages/SettingsFieldsPage";
const navItems = [
    { to: "/records", label: "Journal" },
    { to: "/settings/tags", label: "Settings" }
];
export default function App() {
    return (_jsxs("div", { children: [_jsx("header", { style: {
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    backdropFilter: "blur(10px)",
                    background: "rgba(11,18,33,0.7)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)"
                }, children: _jsxs("div", { className: "container", style: { display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between" }, children: [_jsx("div", { style: { fontWeight: 700, letterSpacing: 0.4, fontSize: "1.1rem" }, children: "Trading Review" }), _jsx("nav", { style: { display: "flex", gap: "0.75rem" }, children: navItems.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => `btn secondary ${isActive ? "" : ""}`, style: ({ isActive }) => ({
                                    background: isActive ? "rgba(79,70,229,0.18)" : "rgba(255,255,255,0.04)",
                                    borderColor: isActive ? "rgba(79,70,229,0.5)" : "rgba(255,255,255,0.08)"
                                }), children: item.label }, item.to))) })] }) }), _jsx("main", { className: "container", style: { paddingTop: "1.5rem" }, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(RecordsPage, {}) }), _jsx(Route, { path: "/records", element: _jsx(RecordsPage, {}) }), _jsx(Route, { path: "/records/:id", element: _jsx(RecordDetailPage, {}) }), _jsx(Route, { path: "/analysis", element: _jsx(RecordsPage, {}) }), _jsx(Route, { path: "/settings/tags", element: _jsx(SettingsTagsPage, {}) }), _jsx(Route, { path: "/settings/fields", element: _jsx(SettingsFieldsPage, {}) })] }) })] }));
}
