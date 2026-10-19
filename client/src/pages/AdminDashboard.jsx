import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, CalendarDays, CheckCircle2, Clock3, FileBarChart2,
  HardHat, RefreshCw, Settings2, ShieldCheck, UserPlus, Users, UserX,
} from 'lucide-react';
import Pagination, { usePagination } from '../components/Pagination';

const API = 'http://localhost:5000/api';

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managerActivity, setManagerActivity] = useState([]);
  const [activityError, setActivityError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const attendancePagination = usePagination(attendance);
  const activityPagination = usePagination(managerActivity);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, attendanceRes, leavesRes, departmentsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/dashboard/attendance`),
        axios.get(`${API}/leaves`),
        axios.get(`${API}/departments/summary`),
      ]);
      setStats(statsRes.data);
      setAttendance(attendanceRes.data);
      setPendingLeaves(leavesRes.data);
      setDepartments(departmentsRes.data);
      try {
        const activityRes = await axios.get(`${API}/admin/manager-activity`, {
          params: { adminId: user.id },
        });
        setManagerActivity(activityRes.data);
        setActivityError('');
      } catch (activityLoadError) {
        console.error('Failed to load manager activity:', activityLoadError);
        setActivityError(activityLoadError.response?.data?.message || 'Could not load manager activity.');
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.response?.data?.message || 'Could not load system overview. Check the server connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadDashboard();
    const refreshInterval = setInterval(loadDashboard, 60000);
    return () => clearInterval(refreshInterval);
  }, [loadDashboard]);

  const statusClass = (status) => ({
    'Clocked In': 'bg-green-100 text-green-700',
    'On Break': 'bg-amber-100 text-amber-700',
    'Clocked Out': 'bg-blue-100 text-blue-700',
  }[status] || 'bg-gray-100 text-gray-600');

  const metrics = [
    { label: 'Employees', value: stats?.totalEmployees ?? '—', icon: <Users size={21} />, color: 'text-blue-700 bg-blue-50' },
    { label: 'Clocked In', value: stats?.clockedIn ?? '—', icon: <CheckCircle2 size={21} />, color: 'text-green-700 bg-green-50' },
    { label: 'On Break', value: stats?.onBreak ?? '—', icon: <Clock3 size={21} />, color: 'text-amber-700 bg-amber-50' },
    { label: 'Absent Today', value: stats?.absent ?? '—', icon: <UserX size={21} />, color: 'text-red-700 bg-red-50' },
  ];

  const tools = [
    { title: 'Employee management', description: 'Review team attendance and department details.', path: '/employees', icon: <Users size={20} /> },
    { title: 'Register employee', description: 'Add an employee and assign their badge.', path: '/register', icon: <UserPlus size={20} /> },
    { title: 'Leave requests', description: `${pendingLeaves.length} request${pendingLeaves.length === 1 ? '' : 's'} awaiting review.`, path: '/leaves', icon: <CalendarDays size={20} /> },
    { title: 'Attendance reports', description: 'Generate and export attendance records.', path: '/reports', icon: <FileBarChart2 size={20} /> },
    { title: 'Digital time cards', description: 'View and print employee monthly time cards.', path: '/timecard', icon: <Activity size={20} /> },
    { title: 'Badge scan kiosk', description: 'Open the badge scanning station.', path: '/badge-scan', icon: <HardHat size={20} />, external: true },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <ShieldCheck size={20} />
            <span className="text-sm font-semibold">System administration</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor workforce activity and open system management tools.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <span className="text-xs text-gray-500">Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={loadDashboard} className="shrink-0 font-semibold underline">Retry</button>
        </div>
      )}

      <section aria-label="Today's workforce summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between rounded-xl border bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-500">{metric.label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{loading && !stats ? '…' : metric.value}</p>
            </div>
            <div className={`rounded-xl p-3 ${metric.color}`}>{metric.icon}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-semibold text-gray-900">Live attendance</h2>
              <p className="mt-1 text-sm text-gray-500">Today's employee clock-in status</p>
            </div>
            <Link to="/employees" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">
              View team <ArrowRight size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Clock in</th>
                  <th className="px-5 py-3 font-semibold">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {attendancePagination.pageItems.map((employee, index) => (
                  <tr key={`${employee.name}-${index}`} className="text-sm">
                    <td className="px-5 py-3 font-medium text-gray-800">{employee.name}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(employee.status)}`}>{employee.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{employee.clockIn}</td>
                    <td className="px-5 py-3 text-gray-600">{Number(employee.hours || 0).toFixed(2)} h</td>
                  </tr>
                ))}
                {!loading && attendance.length === 0 && (
                  <tr><td colSpan="4" className="px-5 py-8 text-center text-sm text-gray-500">No attendance records are available.</td></tr>
                )}
                {loading && attendance.length === 0 && (
                  <tr><td colSpan="4" className="px-5 py-8 text-center text-sm text-gray-500">Loading attendance…</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={attendancePagination.page}
            pageCount={attendancePagination.pageCount}
            total={attendance.length}
            onPageChange={attendancePagination.setPage}
          />
        </div>

        <div className="rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b p-5">
            <div>
              <h2 className="font-semibold text-gray-900">Pending leave</h2>
              <p className="mt-1 text-sm text-gray-500">Requests requiring attention</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{pendingLeaves.length}</span>
          </div>
          <div className="divide-y">
            {pendingLeaves.slice(0, 5).map((leave) => (
              <div key={leave.id} className="p-4">
                <p className="font-medium text-gray-800">{leave.employeeName}</p>
                <p className="mt-1 text-xs text-gray-500">{leave.type} · {String(leave.start_date).slice(0, 10)}</p>
              </div>
            ))}
            {!loading && pendingLeaves.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-500">No pending leave requests.</p>
            )}
          </div>
          <div className="border-t p-4">
            <Link to="/leaves" className="text-sm font-semibold text-blue-700 hover:underline">Review leave requests</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Settings2 size={19} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Management tools</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => {
            const content = (
              <>
                <div className="flex items-start justify-between">
                  <span className="rounded-lg bg-blue-50 p-2.5 text-blue-700">{tool.icon}</span>
                  <ArrowRight size={17} className="text-gray-400" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{tool.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
              </>
            );
            const className = 'rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md';
            return tool.external ? (
              <a key={tool.title} href={tool.path} target="_blank" rel="noreferrer" className={className}>{content}</a>
            ) : (
              <Link key={tool.title} to={tool.path} className={className}>{content}</Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={19} className="text-blue-700" />
              <h2 className="font-semibold text-gray-900">Manager activity</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">Recent employee registrations, leave decisions, and attendance reports</p>
          </div>
          <span className="text-xs text-gray-500">Latest 100 events · refreshes every minute</span>
        </div>
        {activityError ? (
          <p role="alert" className="p-5 text-sm text-red-700">{activityError}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Manager</th>
                  <th className="px-5 py-3 font-semibold">Activity</th>
                  <th className="px-5 py-3 font-semibold">Details</th>
                  <th className="px-5 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activityPagination.pageItems.map((event) => (
                  <tr key={event.id} className="text-sm">
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-gray-800">{event.managerName}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-700">{event.action}</td>
                    <td className="px-5 py-3 text-gray-600">{event.details}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-gray-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {managerActivity.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-sm text-gray-500">
                      No manager activity recorded yet. New supported actions will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
            <Pagination
              page={activityPagination.page}
              pageCount={activityPagination.pageCount}
              total={managerActivity.length}
              onPageChange={activityPagination.setPage}
            />
          </>
        )}
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900">Departments</h2>
        <p className="mt-1 text-sm text-gray-500">Employee distribution and today's attendance by department</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {departments.map((department) => (
            <span key={department.department} className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
              <span className="font-medium">{department.department}</span>
              <span className="ml-2 text-gray-500">{department.totalEmployees} employees</span>
            </span>
          ))}
          {!loading && departments.length === 0 && <p className="text-sm text-gray-500">No department data available.</p>}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
