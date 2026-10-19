import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Sidebar from './components/Sidebar';
import ManagerDashboard from './pages/ManagerDashboard';
import AllEmployees from './pages/AllEmployees';
import RegisterEmployee from './pages/RegisterEmployee';
import LeaveApproval from './pages/LeaveApproval';
import EmployeeDashboard from './pages/EmployeeDashboard';
import TimeClock from './pages/TimeClock';
import BadgeScan from './pages/BadgeScan';
import LeaveRequest from './pages/LeaveRequest';
import TimeCards from './pages/TimeCards';
import Reports from './pages/Reports';
import DigitalTimeCard from './pages/DigitalTimeCard';
import AdminDashboard from './pages/AdminDashboard';
import SystemLogs from './pages/SystemLogs';

function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/admin-setup" element={<Navigate to="/signup" replace />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/badge-scan" element={<BadgeScan isManager={false} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  const isManager = user.role === 'manager' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 font-sans">
        <Sidebar user={user} onLogout={handleLogout} isManager={isManager} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pt-20 lg:pt-6">
            <Routes>
              <Route path="/" element={isAdmin ? <AdminDashboard user={user} /> : isManager ? <ManagerDashboard /> : <EmployeeDashboard user={user} />} />
              <Route path="/admin" element={isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/" replace />} />
              <Route path="/system-logs" element={isAdmin ? <SystemLogs user={user} /> : <Navigate to="/" replace />} />
              <Route path="/employees" element={isManager ? <AllEmployees /> : <Navigate to="/" replace />} />
              <Route path="/register" element={isManager ? <RegisterEmployee user={user} /> : <Navigate to="/" replace />} />
              <Route path="/reports" element={isManager ? <Reports user={user} /> : <Navigate to="/" replace />} />
              <Route path="/leaves" element={isManager ? <LeaveApproval user={user} /> : <LeaveRequest user={user} />} />
              <Route path="/time-clock" element={<TimeClock user={user} />} />
              <Route path="/timecards" element={<TimeCards user={user} />} />
              <Route path="/timecard" element={<DigitalTimeCard user={user} />} />
              <Route path="/badge-scan" element={<BadgeScan isManager={isManager} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;