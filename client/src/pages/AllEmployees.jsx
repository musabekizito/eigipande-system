import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, Clock, UserX, Search, Building2, Mail, Award } from 'lucide-react';
import Pagination, { usePagination } from '../components/Pagination';

const AllEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:5000/api/employees/all'),
      axios.get('http://localhost:5000/api/departments/summary'),
    ]).then(([e, d]) => { setEmployees(e.data); setDepartments(d.data); }).catch(console.error);
  }, []);

  // ---------- HELPER: Convert decimal hours → "8h 30m" ----------
  const formatHours = (decimalHours) => {
    const h = Number(decimalHours) || 0;
    if (h === 0) return '-';

    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);

    if (hours === 0 && minutes === 0) return '0m';
    if (minutes === 0) return `${hours}h`;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const colors = {
    'Management': { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'bg-slate-600' },
    'Carpenters': { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'bg-amber-500' },
    'Scaffolders': { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'bg-orange-500' },
    'Steel Fixers': { bg: 'bg-zinc-100', text: 'text-zinc-700', icon: 'bg-zinc-600' },
    'Operators': { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'bg-cyan-500' },
    'Drivers': { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'bg-indigo-500' },
    'Team Leader': { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'bg-violet-500' },
    'Foreman': { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', icon: 'bg-fuchsia-500' },
    'Forewoman': { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'bg-pink-500' },
    'Safety': { bg: 'bg-red-50', text: 'text-red-700', icon: 'bg-red-500' },
    'HR': { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'bg-rose-500' },
    'IT': { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'bg-blue-500' },
    'Electrician': { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'bg-yellow-500' },
    'Mechanic': { bg: 'bg-teal-50', text: 'text-teal-700', icon: 'bg-teal-500' },
    'Others': { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'bg-gray-500' },
  };
  const getColors = (d) => colors[d] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'bg-gray-500' };

  const statusColor = (s) => ({
    'Clocked In': 'bg-green-100 text-green-700',
    'On Break': 'bg-orange-100 text-orange-700',
    'Clocked Out': 'bg-blue-100 text-blue-700',
  }[s] || 'bg-red-100 text-red-700');

  const filtered = employees.filter(e =>
    (selectedDept === 'All' || e.department === selectedDept) &&
    (e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const { pageItems, page, pageCount, setPage } = usePagination(filtered);

  const totals = employees.reduce((a, e) => {
    if (e.status === 'Clocked In') a.clockedIn++;
    else if (e.status === 'On Break') a.onBreak++;
    else a.absent++;
    return a;
  }, { clockedIn: 0, onBreak: 0, absent: 0 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Employees</h1>
          <p className="text-gray-500 text-sm mt-1">{employees.length} employees across {departments.length} departments</p>
        </div>
        <span className="text-gray-500 text-sm">{new Date().toDateString()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat title="Total Employees" value={employees.length} icon={<Users size={24} className="text-blue-500" />} bg="bg-blue-50" />
        <Stat title="Clocked In" value={totals.clockedIn} icon={<UserCheck size={24} className="text-green-500" />} bg="bg-green-50" />
        <Stat title="On Break" value={totals.onBreak} icon={<Clock size={24} className="text-orange-500" />} bg="bg-orange-50" />
        <Stat title="Absent" value={totals.absent} icon={<UserX size={24} className="text-red-500" />} bg="bg-red-50" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Departments Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departments.map((d) => {
            const c = getColors(d.department);
            const rate = d.totalEmployees ? Math.round(((d.totalEmployees - d.absent) / d.totalEmployees) * 100) : 0;
            return (
              <div key={d.department} onClick={() => setSelectedDept(d.department)}
                className={`bg-white p-5 rounded-lg shadow-sm border hover:shadow-md cursor-pointer transition-shadow ${selectedDept === d.department ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${c.icon} text-white`}><Building2 size={20} /></div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{d.department}</h3>
                      <p className="text-xs text-gray-500">{d.totalEmployees} employees</p>
                    </div>
                  </div>
                  <span className={`text-2xl font-bold ${c.text}`}>{rate}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div><p className="text-green-600 font-bold text-lg">{d.clockedIn}</p><p className="text-gray-500">In</p></div>
                  <div><p className="text-orange-600 font-bold text-lg">{d.onBreak}</p><p className="text-gray-500">Break</p></div>
                  <div><p className="text-blue-600 font-bold text-lg">{d.clockedOut}</p><p className="text-gray-500">Out</p></div>
                  <div><p className="text-red-600 font-bold text-lg">{d.absent}</p><p className="text-gray-500">Absent</p></div>
                </div>
                <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${c.icon}`} style={{ width: `${rate}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <label className="text-sm font-medium text-gray-600">Department:</label>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white">
            <option value="All">All Departments</option>
            {departments.map(d => <option key={d.department} value={d.department}>{d.department}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 font-medium">Employee</th>
              <th className="p-4 font-medium">Department</th>
              <th className="p-4 font-medium">Badge ID</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Clock In</th>
              <th className="p-4 font-medium">Hours</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((emp) => {
              const c = getColors(emp.department);
              return (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white ${c.icon}`}>
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{emp.name}</p>
                        <p className="text-xs text-gray-500 flex items-center space-x-1"><Mail size={12} /><span>{emp.email}</span></p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>{emp.department}</span></td>
                  <td className="p-4 text-sm text-gray-600 flex items-center space-x-1"><Award size={14} className="text-gray-400" /><span>{emp.badge_id || '-'}</span></td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(emp.status)}`}>{emp.status}</span></td>
                  <td className="p-4 text-sm text-gray-600">{emp.clockIn}</td>
                  <td className="p-4 text-sm font-semibold text-gray-800">{formatHours(emp.hours)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No employees match your search.</td></tr>}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} total={filtered.length} onPageChange={setPage} />
      </div>
    </div>
  );
};

const Stat = ({ title, value, icon, bg }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${bg}`}>{icon}</div>
  </div>
);

export default AllEmployees;