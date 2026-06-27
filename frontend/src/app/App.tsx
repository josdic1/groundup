import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopNav from '../components/nav/TopNav';
import MainPage from '../pages/CounterPage';
import OnlineOrder from '../pages/OnlineOrderPage';
import Dashboard from '../pages/DashboardPage';
import CustomersPage from '../pages/CustomersPage';
import MenuPage from '../pages/MenuPage';
import Toast from '../components/ui/Toast';
import { MenuProvider } from '../providers/MenuProvider';
import './App.shell.css';

function App() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const pending = sessionStorage.getItem('mkb-toast');
    if (pending) {
      setToastMessage(pending);
      sessionStorage.removeItem('mkb-toast');
    }
  }, []);

  return (
    <BrowserRouter>
      <MenuProvider>
        <div className="app-shell">
          <TopNav />
          <div className="app-shell-body">
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/online" element={<OnlineOrder />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<CustomersPage />} />
            </Routes>
          </div>
          {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
        </div>
      </MenuProvider>
    </BrowserRouter>
  );
}

export default App;
