import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, Clock, UserX, Eye } from 'lucide-react';
import Pagination, { usePagination } from '../components/Pagination';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({ totalEmployees: 0, clockedIn: 0, onBreak: 0, absent: 0 });
  const [employees, setEmployees] = useState([]);
  const { pageItems, page, pageCount, setPage } = usePagination(employees);

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:5000/api/dashboard/stats'),
      axios.get('http://localhost:5000/api/dashboard/attendance'),
    ]).then(([s, a]) => { setStats(s.data); setEmployees(a.data); })
      .catch(console.error);
  }, []);

  const statCards = [
    { title: 'Total Employees', value: stats.totalEmployees, icon: <Users size={24} className="text-blue-500" />, bg: 'bg-blue-50' },
    { title: 'Clocked In', value: stats.clockedIn, icon: <UserCheck size={24} className="text-green-500" />, bg: 'bg-green-50' },
    { title: 'On Break', value: stats.onBreak, icon: <Clock size={24} className="text-orange-500" />, bg: 'bg-orange-50' },
    { title: 'Absent', value: stats.absent, icon: <UserX size={24} className="text-red-500" />, bg: 'bg-red-50' },
  ];

  const statusColor = (s) => ({
    'Clocked In': 'bg-green-100 text-green-700',
    'On Break': 'bg-orange-100 text-orange-700',
    'Clocked Out': 'bg-blue-100 text-blue-700',
  }[s] || 'bg-red-100 text-red-700');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Team Attendance Overview</h1>
        <span className="text-gray-500 text-sm">{new Date().toDateString()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">{s.title}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
            </div>
            <div className={`p-3 rounded-full ${s.bg}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b"><h2 className="text-lg font-semibold text-gray-800">Today's Attendance</h2></div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="p-4 font-medium">Employee Name</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Clock In</th>
              <th className="p-4 font-medium">Hours</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((emp, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="p-4 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="font-medium text-gray-800">{emp.name}</span>
                </td>
                <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(emp.status)}`}>{emp.status}</span></td>
                <td className="p-4 text-gray-600">{emp.clockIn}</td>
                <td className="p-4 text-gray-600">{emp.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} total={employees.length} onPageChange={setPage} />
        <div className="p-4 text-right">
          <a href="/employees" className="text-blue-600 font-medium text-sm inline-flex items-center hover:underline">
            View Team Report <Eye size={16} className="ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;