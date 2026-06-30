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

  const startWalkthrough = () => {
    window.dispatchEvent(new Event("groundup:start-tutorial"));
    setAdminOpen(false);
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `top-nav-link ${isActive ? "active" : ""}`;

  return (
    <header className="top-nav">
      <a
        href="/"
        className="top-nav-brand"
        data-tooltip="Return to the main register screen."
      >
        {STORE_CONFIG.name}
      </a>

      <nav className="top-nav-links" aria-label="Main navigation">
        <NavLink
          to="/"
          className={navClass}
          data-tooltip="Build in-store counter orders and watch the live order stream."
        >
          <LayoutGrid size={15} />
          Register
        </NavLink>

        <NavLink
          to="/orders"
          className={navClass}
          data-tooltip="Search, filter, and manage current and past orders."
        >
          <ClipboardList size={15} />
          Orders
        </NavLink>

        <NavLink
          to="/online"
          className={navClass}
          data-tooltip="Preview the customer-facing online ordering flow."
        >
          <Globe size={15} />
          Online
        </NavLink>

        <NavLink
          to="/menu"
          className={navClass}
          data-tooltip="Review the active menu and available ordering items."
        >
          <LayoutList size={15} />
          Menu
        </NavLink>

        <NavLink
          to="/customers"
          className={navClass}
          data-tooltip="Look up customers, order history, notes, and loyalty activity."
        >
          <Users size={15} />
          Customers
        </NavLink>

        <NavLink
          to="/reports"
          className={navClass}
          data-tooltip="View sales, order volume, and business performance summaries."
        >
          <BarChart3 size={15} />
          Reports
        </NavLink>

        <div className="admin-dropdown-wrap">
          <button
            type="button"
            className={`top-nav-link admin-trigger ${adminOpen ? "active-open" : ""}`}
            aria-haspopup="menu"
            aria-expanded={adminOpen}
            data-tooltip="Open setup, demo, and walkthrough tools."
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
                className="admin-dropdown-item admin-dropdown-primary"
                type="button"
                role="menuitem"
                data-tooltip="Launch the guided product walkthrough."
                onMouseDown={(event) => {
                  event.preventDefault();
                  startWalkthrough();
                }}
              >
                Start walkthrough
              </button>

              <button
                className="admin-dropdown-item"
                type="button"
                role="menuitem"
                disabled={working}
                data-tooltip="Reload realistic sample customers, orders, and demo activity."
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleDemoData();
                }}
              >
                Load demo data
              </button>

              <button
                className="admin-dropdown-item admin-dropdown-danger"
                type="button"
                role="menuitem"
                disabled={working}
                data-tooltip="Remove current active orders and reset the live order stream."
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
