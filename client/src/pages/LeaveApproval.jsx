import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';
import Pagination, { usePagination } from '../components/Pagination';

const LeaveApproval = ({ user }) => {
  const [leaves, setLeaves] = useState([]);
  const [comments, setComments] = useState('');
  const { pageItems, page, pageCount, setPage } = usePagination(leaves);

  const fetchLeaves = async () => {
    const res = await axios.get('http://localhost:5000/api/leaves');
    setLeaves(res.data);
  };

  useEffect(() => { fetchLeaves(); }, []);

  const decide = async (id, status) => {
    await axios.put(`http://localhost:5000/api/leaves/${id}`, {
      status,
      comments,
      managerId: user.id,
    });
    setComments('');
    fetchLeaves();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Pending Leave Requests</h1>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 font-medium">Employee</th>
              <th className="p-4 font-medium">Dates</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Reason</th>
              <th className="p-4 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map(l => (
              <tr key={l.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{l.employeeName}</td>
                <td className="p-4 text-sm text-gray-600">{String(l.start_date).slice(0, 10)} — {String(l.end_date).slice(0, 10)}</td>
                <td className="p-4 text-gray-600">{l.type}</td>
                <td className="p-4 text-sm text-gray-600">{l.reason}</td>
                <td className="p-4">
                  <div className="flex justify-center space-x-2">
                    <button onClick={() => decide(l.id, 'Approved')} className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                      <CheckCircle size={14} /><span>Approve</span>
                    </button>
                    <button onClick={() => decide(l.id, 'Rejected')} className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                      <XCircle size={14} /><span>Reject</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-500">No pending requests.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} total={leaves.length} onPageChange={setPage} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <label className="block text-sm font-medium text-gray-700 mb-2">Comments (optional)</label>
        <textarea rows="3" value={comments} onChange={(e) => setComments(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Add your comment here..." />
      </div>
    </div>
  );
};

export default LeaveApproval;