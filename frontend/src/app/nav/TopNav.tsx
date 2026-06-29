import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Globe, BarChart3, Users, Settings, ChevronDown, LayoutList } from 'lucide-react';
import { STORE_CONFIG } from '../../config';
import { resetToEmpty, resetToDemoData } from '../../api/demo';

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
      sessionStorage.setItem('mkb-toast', 'Started with no current orders');
      window.location.reload();
    } catch {
      alert('Could not clear data — is the server running?');
      setWorking(false);
    }
  };

  const handleDemoData = async () => {
    setWorking(true);
    try {
      await resetToDemoData();
      sessionStorage.setItem('mkb-toast', 'Loaded demo data');
      window.location.reload();
    } catch {
      alert('Could not load demo data — is the server running?');
      setWorking(false);
    }
  };

  return (
    <header className="top-nav">
      <NavLink to="/" className="top-nav-brand">{STORE_CONFIG.name}</NavLink>
      <nav className="top-nav-links">
        <NavLink to="/" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}><LayoutGrid size={15} />Counter / Stream</NavLink>
        <NavLink to="/online" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}><Globe size={15} />Online Order</NavLink>
        <NavLink to="/menu" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}><LayoutList size={15} />Menu</NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}><BarChart3 size={15} />Dashboard</NavLink>
        <NavLink to="/customers" className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}><Users size={15} />Customers</NavLink>

        <div className="admin-dropdown-wrap">
          <button className={`top-nav-link admin-trigger ${adminOpen ? 'active-open' : ''} ${attentionPing ? 'attention-ping' : ''}`} onClick={() => { setAdminOpen(v => !v); setAttentionPing(false); }} onBlur={() => setTimeout(() => setAdminOpen(false), 150)}>
            <Settings size={15} />Data<ChevronDown size={13} />
          </button>
          {adminOpen && (
            <div className="admin-dropdown">
              <button className="admin-dropdown-item" disabled={working} onMouseDown={(e) => { e.preventDefault(); handleEmpty(); }}>Start with no current orders</button>
              <button className="admin-dropdown-item" disabled={working} onMouseDown={(e) => { e.preventDefault(); handleDemoData(); }}>Load demo data</button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
