import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle } from 'lucide-react';
import Pagination, { usePagination } from '../components/Pagination';

const LeaveRequest = ({ user }) => {
  const [form, setForm] = useState({ start_date: '', end_date: '', type: 'Vacation', reason: '' });
  const [myLeaves, setMyLeaves] = useState([]);
  const [status, setStatus] = useState('');
  const { pageItems, page, pageCount, setPage } = usePagination(myLeaves);

  const fetchMyLeaves = async () => {
    const res = await axios.get(`http://localhost:5000/api/leaves/employee/${user.id}`);
    setMyLeaves(res.data);
  };

  useEffect(() => { fetchMyLeaves(); }, [user.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/leaves', { ...form, user_id: user.id });
      setStatus('Request submitted successfully');
      setForm({ start_date: '', end_date: '', type: 'Vacation', reason: '' });
      fetchMyLeaves();
      setTimeout(() => setStatus(''), 3000);
    } catch (err) { setStatus('Failed to submit request'); }
  };

  const statusColor = (s) => ({
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Pending: 'bg-yellow-100 text-yellow-700',
  }[s] || 'bg-gray-100 text-gray-700');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Leave Request</h1>

      {status && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center space-x-2">
          <CheckCircle size={20} /><span>{status}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Submit Leave Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Start Date</label>
              <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave End Date</label>
              <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type of Leave</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg bg-white">
              <option>Vacation</option>
              <option>Sick Leave</option>
              <option>Personal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea rows="3" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Please provide a reason..." />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg">
            Submit Request
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b"><h2 className="text-lg font-semibold text-gray-800">My Leave Requests</h2></div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 font-medium">Date Range</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(l => (
              <tr key={l.id} className="border-b">
                <td className="p-4 text-sm text-gray-600">
                  <span className="inline-flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{String(l.start_date).slice(0, 10)} — {String(l.end_date).slice(0, 10)}</span>
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">{l.type}</td>
                <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(l.status)}`}>{l.status}</span></td>
              </tr>
            ))}
            {pageItems.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-gray-500">No leave requests yet.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} total={myLeaves.length} onPageChange={setPage} />
      </div>
    </div>
  );
};

export default LeaveRequest;