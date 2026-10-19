import React, { useState } from 'react';
import axios from 'axios';
import { Download, FileText } from 'lucide-react';
import Pagination, { PAGE_SIZE, usePagination } from '../components/Pagination';

const Reports = ({ user }) => {
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    department: 'All Departments',
  });
  const [results, setResults] = useState([]);
  const [generated, setGenerated] = useState(false);
  const { page, pageCount, setPage } = usePagination(results);

  const generate = async () => {
    const res = await axios.post('http://localhost:5000/api/reports/attendance', {
      ...filters,
      managerId: user.id,
    });
    setResults(res.data);
    setPage(1);
    setGenerated(true);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Employee', 'Department', 'Status', 'Hours'];
    const rows = results.map(r => [String(r.date).slice(0, 10), r.employee, r.department, r.status, r.hours]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attendance-report.csv'; a.click();
  };

  const statusColor = (s) => ({
    'Clocked In': 'bg-green-100 text-green-700',
    'Clocked Out': 'bg-blue-100 text-blue-700',
    'On Break': 'bg-orange-100 text-orange-700',
  }[s] || 'bg-red-100 text-red-700');

  const departments = [
    'Carpenters', 'Scaffolders', 'Steel Fixers', 'Electrician', 'Mechanic',
    'Operators', 'Drivers', 'Team Leader', 'Foreman', 'Forewoman',
    'Safety', 'HR', 'IT', 'Others',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Generate Attendance Report</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range (Start)</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range (End)</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg bg-white">
              <option>All Departments</option>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <button onClick={generate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg">
          Generate Report
        </button>
      </div>

      {generated && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Report Results</h2>
            <div className="flex space-x-2">
              <button onClick={exportCSV} className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
                <Download size={14} /><span>Export to CSV</span>
              </button>
              <button onClick={() => window.print()} className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
                <FileText size={14} /><span>Export to PDF</span>
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Employee</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Hours</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr
                  key={i}
                  className={`border-b hover:bg-gray-50 ${i < (page - 1) * PAGE_SIZE || i >= page * PAGE_SIZE ? 'pagination-hidden' : ''}`}
                >
                  <td className="p-4 text-sm text-gray-600">{String(r.date).slice(0, 10)}</td>
                  <td className="p-4 text-sm text-gray-800 font-medium">{r.employee}</td>
                  <td className="p-4 text-sm text-gray-600">{r.department}</td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(r.status)}`}>{r.status}</span></td>
                  <td className="p-4 text-sm text-gray-600">{r.hours ? Number(r.hours).toFixed(2) : '-'}</td>
                </tr>
              ))}
              {results.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No records found.</td></tr>}
            </tbody>
          </table>
          <Pagination page={page} pageCount={pageCount} total={results.length} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default Reports;