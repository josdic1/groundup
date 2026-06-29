import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopNav from './nav/TopNav';
import MainPage from '../features/counter/CounterPage';
import OnlineOrder from '../features/online-order/OnlineOrderPage';
import Dashboard from '../features/dashboard/DashboardPage';
import CustomersPage from '../features/customers/CustomersPage';
import MenuPage from '../features/menu/MenuPage';
import OrdersPage from '../features/orders/OrdersPage';
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
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/reports" element={<Dashboard />} />
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
