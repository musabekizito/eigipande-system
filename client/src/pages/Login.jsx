import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Clock8, User, Lock, Eye, EyeOff, HardHat, Building2, ShieldCheck } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminSetupAvailable, setAdminSetupAvailable] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5000/api/setup/admin-status')
      .then((res) => setAdminSetupAvailable(res.data.available))
      .catch((err) => console.error('Failed to check initial admin setup:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });
      if (res.data.success) onLogin(res.data.user);
      else setError(res.data.message || 'Login failed');
    } catch (err) {
      setError(err.response?.data?.message || (
        err.response
          ? 'The sign-in service is temporarily unavailable. Please try again.'
          : 'Cannot reach the sign-in service. Check that the server is running and try again.'
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ============ LEFT PANEL — Hero with CLEAR background ============ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">

        {/* Background image — NOW VISIBLE (no heavy overlay) */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=90")',
          }}
        />

        {/* LIGHT gradient overlay — just enough for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a3d6b]/70 via-[#0a3d6b]/50 to-[#0a4f8a]/70" />

        {/* Subtle bottom darkening for footer text */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a3d6b]/90 to-transparent" />

        {/* Top darkening for header */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0a3d6b]/80 to-transparent" />

        {/* Yellow safety stripe borders */}
        <div
          className="absolute top-0 left-0 right-0 h-2 z-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #facc15 0, #facc15 20px, #0a3d6b 20px, #0a3d6b 40px)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2 z-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #facc15 0, #facc15 20px, #0a3d6b 20px, #0a3d6b 40px)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          {/* Top — Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border border-white/30 bg-white p-1.5 shadow">
              <img
                src="/mota-engil-africa-logo.jpg"
                alt="Mota-Engil Africa"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold drop-shadow-md">E-igipande</h1>
              <p className="text-xs text-blue-100 tracking-widest uppercase drop-shadow">
                Time & Attendance System
              </p>
            </div>
          </div>

          {/* Middle — Hero content */}
          <div className="max-w-md">
            <div className="inline-flex items-center space-x-2 bg-yellow-400/30 backdrop-blur-sm border border-yellow-400/50 rounded-full px-3 py-1 mb-6">
              <HardHat size={14} className="text-yellow-200" />
              <span className="text-xs font-medium text-yellow-100 tracking-wide uppercase drop-shadow">
                Mota-Engil Africa
              </span>
            </div>

            <h2 className="text-4xl font-bold leading-tight mb-4 drop-shadow-lg">
              Building the future,{' '}
              <span className="text-yellow-300">one project at a time.</span>
            </h2>

            <p className="text-blue-50 mb-8 drop-shadow-md">
              The official time & attendance platform for Mota-Engil Africa.
            </p>

            <div className="space-y-3">
              {[
                { icon: <Clock8 size={16} />, text: 'Real-time site attendance tracking' },
                { icon: <Building2 size={16} />, text: 'Multi-department crew management' },
                { icon: <ShieldCheck size={16} />, text: 'Safety & compliance reporting' },
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-3 text-blue-50 drop-shadow">
                  <div className="p-1.5 bg-yellow-400/30 backdrop-blur-sm rounded-md text-yellow-200">
                    {item.icon}
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom — Footer */}
          <div className="flex items-center justify-between text-xs text-blue-100 drop-shadow">
            <span>© 2026 E-igipande · Mota-Engil Africa</span>
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span>All systems operational</span>
            </span>
          </div>
        </div>
      </div>

      {/* ============ RIGHT PANEL — Login Form ============ */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
          <p className="text-gray-500 mb-8">Sign in to access your dashboard</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="manager@eigipande.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span className="text-gray-600">Remember Me</span>
              </label>
              <a href="#" className="text-blue-600 hover:underline">Forgot Password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-medium hover:underline">
              Create one
            </Link>
          </div>
          {adminSetupAvailable && (
            <div className="mt-3 text-center text-sm">
              <Link to="/signup" className="font-semibold text-blue-700 hover:underline">
                First time here? Create the system administrator account
              </Link>
            </div>
          )}

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-xs text-gray-400 uppercase">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <Link
            to="/badge-scan"
            className="flex items-center justify-center space-x-2 w-full py-3 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg text-gray-700 font-medium transition-all"
          >
            <HardHat size={18} className="text-blue-600" />
            <span>Enter Badge Scan Kiosk</span>
          </Link>

          <p className="text-center text-xs text-gray-500 mt-8">
            © 2026 E-igipande · Mota-Engil Africa
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;