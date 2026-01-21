import { NavLink, Route, Routes } from "react-router-dom";
import RecordsPage from "./pages/RecordsPage";
import RecordDetailPage from "./pages/RecordDetailPage";
import SettingsTagsPage from "./pages/SettingsTagsPage";
import SettingsFieldsPage from "./pages/SettingsFieldsPage";
import ChartsPage from "./pages/ChartsPage";

const navItems = [
  { to: "/records", label: "Journal" },
  { to: "/charts", label: "Charts" },
  { to: "/settings/tags", label: "Settings" }
];

export default function App() {
  return (
    <div>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(12px)",
          background: "rgba(255,255,255,0.85)",
          borderBottom: "1px solid rgba(0,0,0,0.06)"
        }}
      >
        <div className="container" style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, letterSpacing: 0.2, fontSize: "1.1rem", color: "#0b1d32" }}>
            Trading Review
          </div>
          <nav style={{ display: "flex", gap: "0.75rem" }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `btn secondary ${isActive ? "" : ""}`
                }
                style={({ isActive }) => ({
                  background: isActive ? "rgba(0,113,227,0.12)" : "rgba(255,255,255,0.7)",
                  borderColor: isActive ? "rgba(0,113,227,0.4)" : "#d5dbe7",
                  color: "#0b1d32"
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container" style={{ paddingTop: "1.5rem" }}>
        <Routes>
          <Route path="/" element={<RecordsPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/records/:id" element={<RecordDetailPage />} />
          <Route path="/analysis" element={<ChartsPage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/settings/tags" element={<SettingsTagsPage />} />
          <Route path="/settings/fields" element={<SettingsFieldsPage />} />
        </Routes>
      </main>
    </div>
  );
}
