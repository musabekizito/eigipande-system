import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Coffee, CheckCircle } from 'lucide-react';

const TimeClock = ({ user }) => {
  const [now, setNow] = useState(new Date());
  const [today, setToday] = useState({ status: 'Absent', clockIn: '-', totalHours: 0 });

  const fetchToday = async () => {
    const res = await axios.get(`http://localhost:5000/api/employee/${user.id}/today`);
    setToday(res.data);
  };

  useEffect(() => {
    fetchToday();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [user.id]);

  const handleClockIn = async () => { await axios.post(`http://localhost:5000/api/employee/${user.id}/clock-in`); fetchToday(); };
  const handleClockOut = async () => { await axios.post(`http://localhost:5000/api/employee/${user.id}/clock-out`); fetchToday(); };
  const handleBreak = async () => { await axios.post(`http://localhost:5000/api/employee/${user.id}/break`); fetchToday(); };

  const isClockedIn = today.status === 'Clocked In' || today.status === 'On Break';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border p-10 text-center">
        <p className="text-gray-500 text-sm">{now.toDateString()}</p>
        <p className="text-6xl font-bold text-[#0a3d6b] mt-2 mb-6">
          {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </p>
        <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full mb-8">
          <CheckCircle size={18} />
          <span className="font-medium">{isClockedIn ? 'You are Clocked In' : 'You are Clocked Out'}</span>
        </div>
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {!isClockedIn ? (
            <button onClick={handleClockIn} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center space-x-2">
              <LogOut size={18} className="rotate-180" /> <span>Clock In</span>
            </button>
          ) : (
            <>
              <button onClick={handleClockOut} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center space-x-2">
                <LogOut size={18} /> <span>Clock Out</span>
              </button>
              <button onClick={handleBreak} className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-lg flex items-center space-x-2">
                <Coffee size={18} /> <span>Start Break</span>
              </button>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 border-t pt-6">
          <div>
            <p className="text-gray-500 text-sm">Clock In</p>
            <p className="text-xl font-bold text-gray-800">{today.clockIn}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Hours</p>
            <p className="text-xl font-bold text-gray-800">{Number(today.totalHours).toFixed(2)} h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeClock;