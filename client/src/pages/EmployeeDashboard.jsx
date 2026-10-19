import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, History, Calendar, Coffee } from 'lucide-react';

const EmployeeDashboard = ({ user }) => {
  const [today, setToday] = useState({ status: 'Absent', clockIn: '-', totalHours: 0 });
  const [time, setTime] = useState(new Date());

  const fetchToday = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/employee/${user.id}/today`);
      setToday(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchToday();
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [user.id]);

  const handleClockIn = async () => { await axios.post(`http://localhost:5000/api/employee/${user.id}/clock-in`); fetchToday(); };
  const handleClockOut = async () => { await axios.post(`http://localhost:5000/api/employee/${user.id}/clock-out`); fetchToday(); };
  const handleBreak = async () => { await axios.post(`http://localhost:5000/api/employee/${user.id}/break`); fetchToday(); };

  const isClockedIn = today.status === 'Clocked In' || today.status === 'On Break';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-gray-500 text-sm">Good Morning,</p>
            <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-gray-500 text-sm capitalize">{user.role}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm">{time.toDateString()}</p>
          <p className="text-2xl font-bold text-gray-800">{time.toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500 text-sm mb-2">Current Status</p>
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${
              today.status === 'Clocked In' ? 'bg-green-500' :
              today.status === 'On Break' ? 'bg-orange-500' : 'bg-red-500'
            }`}></span>
            <span className="text-xl font-bold text-gray-800">{today.status}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-gray-500 text-sm mb-2">Total Hours Worked</p>
          <p className="text-xl font-bold text-gray-800">{Number(today.totalHours).toFixed(2)} h</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Time Actions</h3>
        <div className="flex flex-wrap gap-3">
          {!isClockedIn ? (
            <button onClick={handleClockIn} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2">
              <LogOut size={20} className="rotate-180" /><span>Clock In</span>
            </button>
          ) : (
            <>
              <button onClick={handleClockOut} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2">
                <LogOut size={20} /><span>Clock Out</span>
              </button>
              <button onClick={handleBreak} className="flex-1 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 rounded-lg flex items-center justify-center space-x-2">
                <Coffee size={20} /><span>Start Break</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/timecards" className="bg-white rounded-lg shadow-sm border p-6 flex items-center space-x-4 hover:shadow-md">
          <div className="p-3 bg-blue-50 rounded-lg"><History size={24} className="text-blue-600" /></div>
          <div>
            <p className="font-semibold text-gray-800">Attendance History</p>
            <p className="text-gray-500 text-sm">View your past records</p>
          </div>
        </a>
        <a href="/leaves" className="bg-white rounded-lg shadow-sm border p-6 flex items-center space-x-4 hover:shadow-md">
          <div className="p-3 bg-purple-50 rounded-lg"><Calendar size={24} className="text-purple-600" /></div>
          <div>
            <p className="font-semibold text-gray-800">Leave Request</p>
            <p className="text-gray-500 text-sm">Submit a new request</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default EmployeeDashboard;