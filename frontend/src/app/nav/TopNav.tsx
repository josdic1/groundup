import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  Globe,
  LayoutGrid,
  LayoutList,
  Settings,
  Users,
} from "lucide-react";
import { STORE_CONFIG } from "../../config";
import { resetToEmpty, resetToDemoData } from "../../api/demo";

export default function TopNav() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [working, setWorking] = useState(false);

  const handleEmpty = async () => {
    setWorking(true);

    try {
      await resetToEmpty();
      sessionStorage.setItem("mkb-toast", "Started with no current orders");
      window.location.reload();
    } catch {
      alert("Could not clear data — is the server running?");
      setWorking(false);
    }
  };

  const handleDemoData = async () => {
    setWorking(true);

    try {
      await resetToDemoData();
      sessionStorage.setItem("mkb-toast", "Loaded demo data");
      window.location.reload();
    } catch {
      alert("Could not load demo data — is the server running?");
      setWorking(false);
    }
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `top-nav-link ${isActive ? "active" : ""}`;

  return (
    <header className="top-nav">
      <a href="/" className="top-nav-brand">
        {STORE_CONFIG.name}
      </a>

      <nav className="top-nav-links" aria-label="Main navigation">
        <NavLink to="/" className={navClass}>
          <LayoutGrid size={15} />
          Register
        </NavLink>

        <NavLink to="/orders" className={navClass}>
          <ClipboardList size={15} />
          Orders
        </NavLink>

        <NavLink to="/online" className={navClass}>
          <Globe size={15} />
          Online
        </NavLink>

        <NavLink to="/menu" className={navClass}>
          <LayoutList size={15} />
          Menu
        </NavLink>

        <NavLink to="/customers" className={navClass}>
          <Users size={15} />
          Customers
        </NavLink>

        <NavLink to="/reports" className={navClass}>
          <BarChart3 size={15} />
          Reports
        </NavLink>

        <div className="admin-dropdown-wrap">
          <button
            type="button"
            className={`top-nav-link admin-trigger ${adminOpen ? "active-open" : ""}`}
            aria-haspopup="menu"
            aria-expanded={adminOpen}
            onClick={() => setAdminOpen((value) => !value)}
            onBlur={() => setTimeout(() => setAdminOpen(false), 150)}
          >
            <Settings size={15} />
            Admin
            <ChevronDown size={13} />
          </button>

          {adminOpen && (
            <div className="admin-dropdown" role="menu">
                            <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new Event('groundup:start-tutorial'));
                }}
              >
                Start walkthrough
              </button>

<button
                className="admin-dropdown-item"
                type="button"
                disabled={working}
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleDemoData();
                }}
              >
                Load demo data
              </button>

              <button
                className="admin-dropdown-item"
                type="button"
                disabled={working}
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleEmpty();
                }}
              >
                Clear current orders
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
