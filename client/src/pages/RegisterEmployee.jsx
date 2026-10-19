import React, { useState } from 'react';
import axios from 'axios';
import {
  UserPlus, CheckCircle, AlertCircle, Phone, IdCard,
} from 'lucide-react';

const RegisterEmployee = ({ user }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Carpenters',
    badge_id: '',
    phone: '',
    id_number: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const departments = [
    { group: 'Skilled Trades', options: ['Carpenters', 'Scaffolders', 'Steel Fixers', 'Electrician', 'Mechanic'] },
    { group: 'Equipment', options: ['Operators', 'Drivers'] },
    { group: 'Supervision', options: ['Team Leader', 'Foreman', 'Forewoman'] },
    { group: 'Support', options: ['Safety', 'HR', 'IT', 'Others'] },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status.message) setStatus({ type: '', message: '' });
  };

  const generateBadgeId = () => {
    if (!formData.badge_id) {
      setFormData({
        ...formData,
        badge_id: 'BADGE-' + Math.floor(1000 + Math.random() * 9000),
      });
    }
  };

  // ---------- SUBMIT ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    // Validation
    if (!formData.name.trim()) return setStatus({ type: 'error', message: 'Full name is required.' });
    if (!formData.email.trim()) return setStatus({ type: 'error', message: 'Email is required.' });
    if (formData.password.length < 6) return setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
    if (formData.phone && !/^[0-9+\-\s()]{7,20}$/.test(formData.phone)) {
      return setStatus({ type: 'error', message: 'Please enter a valid phone number.' });
    }

    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:5000/api/employees/register',
        { ...formData, managerId: user.id }
      );

      if (res.data.success) {
        setStatus({ type: 'success', message: 'Employee registered successfully!' });
        // Reset form
        setFormData({
          name: '', email: '', password: '',
          department: 'Carpenters', badge_id: '',
          phone: '', id_number: '',
        });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Registration failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
          <UserPlus size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Register New Employee</h1>
          <p className="text-gray-500 text-sm">Add a new team member to the E-igipande system.</p>
        </div>
      </div>

      {/* Status banner */}
      {status.message && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          status.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{status.message}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ============ BASIC INFO ============ */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone size={12} className="inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+250 7XX XXX XXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <IdCard size={12} className="inline mr-1" />
                    National ID Number
                  </label>
                  <input
                    type="text"
                    name="id_number"
                    value={formData.id_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="1 1990 8 XXXXXX X XX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Min 6 characters"
                    minLength="6"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ============ WORK INFO ============ */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Work Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {departments.map((group, gi) => (
                    <optgroup key={gi} label={group.group}>
                      {group.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge ID (RFID)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="badge_id"
                    value={formData.badge_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="BADGE-XXXX"
                  />
                  <button
                    type="button"
                    onClick={generateBadgeId}
                    className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium whitespace-nowrap transition-colors"
                  >
                    Auto-Gen
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============ SUBMIT ============ */}
          <div className="pt-4 border-t border-gray-100 flex space-x-3">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  name: '', email: '', password: '',
                  department: 'Carpenters', badge_id: '',
                  phone: '', id_number: '',
                });
                setStatus({ type: '', message: '' });
              }}
              className="px-6 py-3 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-lg transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Register Employee</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegisterEmployee;