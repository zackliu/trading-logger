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
  return (
    <div>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(10px)",
          background: "rgba(11,18,33,0.7)",
          borderBottom: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div className="container" style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, letterSpacing: 0.4, fontSize: "1.1rem" }}>
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
                  background: isActive ? "rgba(79,70,229,0.18)" : "rgba(255,255,255,0.04)",
                  borderColor: isActive ? "rgba(79,70,229,0.5)" : "rgba(255,255,255,0.08)"
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
          <Route path="/analysis" element={<RecordsPage />} />
          <Route path="/settings/tags" element={<SettingsTagsPage />} />
          <Route path="/settings/fields" element={<SettingsFieldsPage />} />
        </Routes>
      </main>
    </div>
  );
}
