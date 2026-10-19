import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock8, User, Mail, Lock, Eye, EyeOff, Building2, Award, CheckCircle, AlertCircle, UserCog } from 'lucide-react';

const employeeDepartments = [
  'Carpenter', 'Scaffolder', 'Steel Fixer', 'Electrician', 'Mechanician',
  'Operator', 'Driver', 'Team Leader', 'Foreman', 'Forewoman',
  'Safety'
];

const departmentsByRole = {
  employee: employeeDepartments,
  manager: ['HR', 'IT', 'Others'],
  admin: ['Management'],
};

const SignUp = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    department: 'Carpenters', badge_id: '', role: 'employee',
    setupKey: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [adminSetupAvailable, setAdminSetupAvailable] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/setup/admin-status')
      .then((res) => {
        setAdminSetupAvailable(res.data.available);
        if (res.data.available) {
          setForm((current) => ({
            ...current,
            role: 'admin',
            department: 'Management',
          }));
        }
      })
      .catch((err) => {
        console.error('Failed to check initial admin setup:', err);
        setAdminSetupAvailable(false);
      });
  }, []);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'role') {
      const availableDepartments = departmentsByRole[e.target.value];
      if (!availableDepartments.includes(updated.department)) {
        updated.department = availableDepartments[0];
      }
      if (e.target.value === 'admin') {
        updated.badge_id = '';
      }
    }
    setForm(updated);
    if (status.message) setStatus({ type: '', message: '' });
  };

  const generateBadgeId = () => {
    const random = 'BADGE-' + Math.floor(1000 + Math.random() * 9000);
    setForm({ ...form, badge_id: random });
  };

  const validate = () => {
    if (!form.name.trim()) return 'Please enter your full name';
    if (!form.email.trim()) return 'Please enter your email';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email';
    if (form.password.length < (form.role === 'admin' ? 12 : 6)) {
      return form.role === 'admin'
        ? 'Admin password must be at least 12 characters'
        : 'Password must be at least 6 characters';
    }
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (form.role === 'admin' && !form.setupKey.trim()) return 'Please enter the admin setup key';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) { setStatus({ type: 'error', message: error }); return; }

    setLoading(true);
    try {
      const res = form.role === 'admin'
        ? adminSetupAvailable
          ? await axios.post('http://localhost:5000/api/setup/admin', {
          name: form.name,
          email: form.email,
          password: form.password,
          setupKey: form.setupKey,
          })
          : await axios.post('http://localhost:5000/api/admin/create-admin', {
          name: form.name,
          email: form.email,
          password: form.password,
          setupKey: form.setupKey,
          })
        : await axios.post('http://localhost:5000/api/auth/register', {
          name: form.name, email: form.email, password: form.password,
          department: form.department, badge_id: form.badge_id || null, role: form.role,
        });
      if (res.data.success) {
        setStatus({
          type: 'success',
          message: form.role === 'admin'
            ? 'Admin account created! Redirecting to sign in...'
            : 'Account created! Redirecting to login...',
        });
        if (form.role === 'admin') setAdminSetupAvailable(false);
        setTimeout(() => navigate('/login'), 1800);
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Registration failed.' });
    } finally { setLoading(false); }
  };

  const departments = departmentsByRole[form.role];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-green-50">
      <div className="hidden lg:flex lg:w-1/2 bg-[#0a3d6b] items-center justify-center p-12">
        <div className="text-white max-w-md">
          <div className="flex items-center space-x-3 mb-6">
            <Clock8 size={48} />
            <div>
              <h1 className="text-3xl font-bold">E-igipande</h1>
              <p className="text-sm text-blue-200">Mota-Engil Africa</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">Join our team</h2>
          <p className="text-blue-100 mb-6">Create your account to start tracking attendance.</p>
          <div className="space-y-3">
            {['Secure attendance tracking', 'Easy leave management', 'Real-time dashboards', 'Badge scanning support'].map((t, i) => (
              <div key={i} className="flex items-center space-x-3 text-blue-100">
                <CheckCircle size={18} className="text-green-400" /><span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="max-w-md w-full my-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create an Account</h1>
          <p className="text-gray-500 mb-6">
            {adminSetupAvailable
              ? 'Create the first system administrator, or register an employee or manager.'
              : 'Fill in your details to get started'}
          </p>

          {status.message && (
            <div className={`p-3 rounded-lg mb-4 text-sm flex items-start space-x-2 ${
              status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span>{status.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" name="name" required value={form.name} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" name="email" required value={form.email} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="you@company.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} name="password" required value={form.password} onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={form.role === 'admin' ? 'At least 12 characters' : 'Min 6 characters'}
                  minLength={form.role === 'admin' ? '12' : '6'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" required value={form.confirmPassword} onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Re-enter password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type *</label>
                <div className="relative">
                  <UserCog size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select name="role" value={form.role} onChange={handleChange}
                    className="w-full pl-9 pr-3 py-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">{adminSetupAvailable ? 'Admin (initial setup)' : 'Admin'}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select name="department" value={form.department} onChange={handleChange}
                    className="w-full pl-9 pr-3 py-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {form.role === 'admin' && (
              <div>
                {adminSetupAvailable ? (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">One-time Admin Setup Key *</label>
                    <input
                      type="password"
                      name="setupKey"
                      required
                      autoComplete="off"
                      value={form.setupKey}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Provided by the system administrator"
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter the one-time key configured on the server.</p>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Creation Key *</label>
                    <input
                      type="password"
                      name="setupKey"
                      required
                      autoComplete="off"
                      value={form.setupKey}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Configured by the system administrator"
                    />
                    <p className="mt-1 text-xs text-gray-500">Use the admin key configured on the server. Existing admin credentials are not required.</p>
                  </>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Badge ID (optional)</label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Award size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="badge_id" value={form.badge_id} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="BADGE-1234" />
                </div>
                <button type="button" onClick={generateBadgeId}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">Auto-Gen</button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span><span>Creating...</span></>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;