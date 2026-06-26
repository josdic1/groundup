import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopNav from './components/TopNav';
import MainPage from './components/MainPage';
import OnlineOrder from './components/OnlineOrder';
import Dashboard from './components/Dashboard';
import Toast from './components/Toast';
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
      <div className="app-shell">
        <TopNav />
        <div className="app-shell-body">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/online" element={<OnlineOrder />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
        {toastMessage && (
          <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
