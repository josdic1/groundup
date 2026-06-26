import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Globe, BarChart3, Settings, ChevronDown } from 'lucide-react';
import { STORE_CONFIG } from '../config';
import { resetToEmpty, resetToDemoData } from '../api/demo';
import './TopNav.css';

export default function TopNav() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [attentionPing, setAttentionPing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAttentionPing(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleEmpty = async () => {
    setWorking(true);
    try {
      await resetToEmpty();
      sessionStorage.setItem('mkb-toast', 'Started with no data');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Could not clear data — is the server running?');
      setWorking(false);
    }
  };

  const handleDemoData = async () => {
    setWorking(true);
    try {
      await resetToDemoData();
      sessionStorage.setItem('mkb-toast', 'Loaded a month of demo data');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Could not load demo data — is the server running?');
      setWorking(false);
    }
  };

  return (
    <header className="top-nav">
      <span className="top-nav-brand">{STORE_CONFIG.name}</span>
      <nav className="top-nav-links">
        <NavLink
          to="/"
          className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutGrid size={15} strokeWidth={2} />
          Counter / Stream
        </NavLink>
        <NavLink
          to="/online"
          className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
        >
          <Globe size={15} strokeWidth={2} />
          Online Order
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
        >
          <BarChart3 size={15} strokeWidth={2} />
          Dashboard
        </NavLink>

        <div className="admin-dropdown-wrap">
          <button
            className={`top-nav-link admin-trigger ${adminOpen ? 'active-open' : ''} ${attentionPing ? 'attention-ping' : ''}`}
            onClick={() => {
              setAdminOpen((v) => !v);
              setAttentionPing(false);
            }}
            onBlur={() => setTimeout(() => setAdminOpen(false), 150)}
          >
            <Settings size={15} strokeWidth={2} />
            Data
            <ChevronDown size={13} strokeWidth={2} />
          </button>
          {adminOpen && (
            <div className="admin-dropdown">
              <button
                className="admin-dropdown-item"
                disabled={working}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleEmpty();
                }}
              >
                Start with no data
              </button>
              <button
                className="admin-dropdown-item"
                disabled={working}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleDemoData();
                }}
              >
                Load a month of demo data
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
