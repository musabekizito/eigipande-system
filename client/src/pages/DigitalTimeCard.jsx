import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarDays, Printer } from 'lucide-react';

const DigitalTimeCard = ({ user }) => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [card, setCard] = useState({
    employee: {},
    monthName: '',
    days: [],
    totalHoursMonth: '0',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const [year, month] = selectedMonth.split('-');
    setLoading(true);

    axios
      .get(`http://localhost:5000/api/timecard/${user.id}/${year}/${month}`)
      .then((res) => {
        setCard(res.data || { employee: {}, monthName: '', days: [], totalHoursMonth: '0' });
      })
      .catch((error) => {
        console.error('Failed to load time card:', error);
        setCard({ employee: {}, monthName: '', days: [], totalHoursMonth: '0' });
      })
      .finally(() => setLoading(false));
  }, [selectedMonth, user]);

  const employeeName = card.employee?.name || user?.name || 'Employee';
  const department = card.employee?.department || user?.department || 'N/A';
  const badgeId = card.employee?.badge_id || user?.badge_id || 'N/A';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">Attendance</p>
          <h1 className="text-2xl font-bold text-gray-800">Digital Time Card</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
            <CalendarDays size={16} className="text-blue-600" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-4 text-center text-gray-600">Loading time card...</p>
        </div>
      ) : (
        <div className="time-card overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:justify-between">
              <img
                src="/mota-engil-africa-logo.jpg"
                alt="Mota-Engil Africa"
                className="h-16 w-32 rounded bg-white object-contain p-1"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-800">{employeeName}</h2>
                <p className="text-sm text-gray-600">{department} · Badge ID: {badgeId}</p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                <span className="font-semibold">Month:</span> {card.monthName || '—'}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border border-gray-200 px-3 py-3 font-semibold">Day</th>
                  <th className="border border-gray-200 px-3 py-3 font-semibold">Entry Time</th>
                  <th className="border border-gray-200 px-3 py-3 font-semibold">Departure Time</th>
                  <th className="border border-gray-200 px-3 py-3 font-semibold">Total Hours</th>
                  <th className="border border-gray-200 px-3 py-3 font-semibold">Signature</th>
                  <th className="border border-gray-200 px-3 py-3 font-semibold">Supervisor</th>
                  <th className="border border-gray-200 px-3 py-3 font-semibold">Area</th>
                </tr>
              </thead>

              <tbody>
                {card.days.length > 0 ? (
                  card.days.map((day, index) => (
                    <tr key={`${day.day || index}`} className="align-top">
                      <td className="border border-gray-200 px-3 py-3 font-medium">{day.day || index + 1}</td>
                      <td className="border border-gray-200 px-3 py-3">{day.entryTime || '-'}</td>
                      <td className="border border-gray-200 px-3 py-3">{day.departureTime || '-'}</td>
                      <td className="border border-gray-200 px-3 py-3">{day.totalHours || '-'}</td>
                      <td className="border border-gray-200 px-3 py-3">{day.signature || '-'}</td>
                      <td className="border border-gray-200 px-3 py-3">{day.supervisorSignature || '-'}</td>
                      <td className="border border-gray-200 px-3 py-3">{day.area || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No attendance data available for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="font-semibold text-gray-800">Total Hours:</span> {card.totalHoursMonth || '0.0'}
            </div>
            <div>
              <span className="font-semibold text-gray-800">Prepared For:</span> {employeeName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalTimeCard;
