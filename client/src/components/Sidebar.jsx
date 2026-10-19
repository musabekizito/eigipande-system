import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Activity, LayoutDashboard, Users, CalendarOff, FileText, UserPlus, ShieldCheck,
  LogOut, History, Clock, HardHat, Menu, X, Lock, Eye, EyeOff,
  CheckCircle, AlertCircle,
} from 'lucide-react';

const Sidebar = ({ user, onLogout, isManager }) => {
  const location = useLocation();
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (isManager) {
      axios.get('http://localhost:5000/api/leaves')
        .then((res) => setPendingLeaves(res.data.length))
        .catch(() => setPendingLeaves(0));
    }
  }, [isManager, location.pathname]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const managerMenu = [
    { name: user?.role === 'admin' ? 'Admin Control Center' : 'Dashboard', path: '/', icon: user?.role === 'admin' ? <ShieldCheck size={20} /> : <LayoutDashboard size={20} /> },
    ...(user?.role === 'admin' ? [{ name: 'System Logs', path: '/system-logs', icon: <Activity size={20} /> }] : []),
    { name: 'Team Attendance', path: '/employees', icon: <Users size={20} /> },
    { name: 'Leave Requests', path: '/leaves', icon: <CalendarOff size={20} />, badge: pendingLeaves > 0 ? pendingLeaves : null },
    { name: 'Reports', path: '/reports', icon: <FileText size={20} /> },
    { name: 'Register Employee', path: '/register', icon: <UserPlus size={20} /> },
    { name: 'Digital Time Card', path: '/timecard', icon: <FileText size={20} /> },
  ];

  const employeeMenu = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Time Clock', path: '/time-clock', icon: <Clock size={20} /> },
    { name: 'Attendance History', path: '/timecards', icon: <History size={20} /> },
    { name: 'My Time Card', path: '/timecard', icon: <FileText size={20} /> },
    { name: 'Leave Request', path: '/leaves', icon: <CalendarOff size={20} /> },
  ];

  const menuItems = isManager ? managerMenu : employeeMenu;
  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-blue-800">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-white p-1">
            <img
              src="/mota-engil-africa-logo.jpg"
              alt="Mota-Engil Africa"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">E-igipande</h1>
            <p className="text-[10px] text-blue-200 tracking-widest uppercase">Mota-Engil Africa</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-blue-800 bg-blue-900/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-blue-900 font-bold text-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-blue-200 capitalize truncate">
              {user?.role}{user?.department ? ` · ${user.department}` : ''}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-2 overflow-y-auto">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link to={item.path} key={index}
              className={`flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-blue-800 transition-colors ${
                isActive ? 'bg-blue-600 border-l-4 border-yellow-400' : ''
              }`}>
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-yellow-300' : 'text-white/80'}>{item.icon}</span>
                <span className={`font-medium ${isActive ? 'text-white' : 'text-white/90'}`}>{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-blue-800">
        {/* Change Password */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center space-x-3 px-6 py-3 hover:bg-blue-800 transition-colors text-blue-100"
        >
          <Lock size={20} />
          <span className="font-medium text-sm">Change Password</span>
        </button>

        {isManager && (
          <Link to="/badge-scan" target="_blank"
            className="flex items-center space-x-3 px-6 py-3 hover:bg-blue-800 transition-colors text-yellow-300 border-t border-blue-800">
            <HardHat size={20} />
            <span className="font-medium text-sm">Badge Scan Kiosk</span>
          </Link>
        )}

        <div onClick={onLogout}
          className="flex items-center space-x-3 px-6 py-3 cursor-pointer hover:bg-red-600/80 transition-colors border-t border-blue-800">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-[#0a3d6b] text-white flex-col h-full shadow-xl">
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a3d6b] text-white flex items-center justify-between p-3 border-b border-blue-800">
        <div className="flex items-center space-x-2">
          <img
            src="/mota-engil-africa-logo.jpg"
            alt=""
            className="h-8 w-12 rounded bg-white object-contain p-0.5"
          />
          <span className="font-bold">E-igipande</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 hover:bg-blue-800 rounded-lg">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-[#0a3d6b] text-white flex flex-col z-50 shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b border-blue-800">
              <div className="flex items-center space-x-2">
                <img
                  src="/mota-engil-africa-logo.jpg"
                  alt=""
                  className="h-8 w-12 rounded bg-white object-contain p-0.5"
                />
                <span className="font-bold">E-igipande</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-blue-800 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ============ CHANGE PASSWORD MODAL ============ */}
      {showPasswordModal && (
        <ChangePasswordModal
          user={user}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </>
  );
};

/* ============================================================
   CHANGE PASSWORD MODAL
   ============================================================ */
const ChangePasswordModal = ({ user, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    // Validation
    if (!currentPassword) {
      setStatus({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword === currentPassword) {
      setStatus({ type: 'error', message: 'New password must be different from current password.' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/${user.id}/change-password`,
        { currentPassword, newPassword }
      );

      if (res.data.success) {
        setStatus({ type: 'success', message: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => onClose(), 1800);
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to change password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#0a3d6b] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">Change Password</h2>
              <p className="text-xs text-blue-200">Update your account password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status */}
          {status.message && (
            <div className={`p-3 rounded-lg flex items-start space-x-2 text-sm ${
              status.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password *
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Min 6 characters"
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Re-enter new password"
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <p>• Password must be at least 6 characters long</p>
            <p>• Choose a strong password you don't use elsewhere</p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sidebar;