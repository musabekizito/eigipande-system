import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import Pagination, { PAGE_SIZE } from '../components/Pagination';

const API = 'http://localhost:5000/api';
const categories = ['auth', 'users', 'attendance', 'leaves', 'reports', 'security'];

const SystemLogs = ({ user }) => {
  const [records, setRecords] = useState([]);
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API}/admin/system-logs`, {
        params: { adminId: user.id, category, search, page },
      });
      setRecords(response.data.records);
      setTotal(Number(response.data.total));
    } catch (loadError) {
      console.error('Failed to load system logs:', loadError);
      setError(loadError.response?.data?.message || 'Could not load system logs. Check the server connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [category, page, search, user.id]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const updateCategory = (event) => {
    setCategory(event.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-blue-700">
            <ShieldCheck size={20} />
            <span className="text-sm font-semibold">System administration</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="mt-1 text-sm text-gray-500">Review account, attendance, leave, and security events.</p>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      <section className="rounded-xl border bg-white shadow-sm">
        <form onSubmit={applyFilters} className="flex flex-col gap-3 border-b p-4 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search system logs</span>
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search actor, action, or details"
              className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={category}
              onChange={updateCategory}
              className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm capitalize outline-none focus:ring-2 focus:ring-blue-500 sm:w-48"
            >
              <option value="">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Search size={16} />
            Search
          </button>
        </form>

        {error ? (
          <div role="alert" className="flex flex-col gap-3 p-5 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button type="button" onClick={loadLogs} className="shrink-0 font-semibold underline">Retry</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-3 text-sm text-gray-500">
              <span>{loading ? 'Loading logs…' : `${total.toLocaleString()} event${total === 1 ? '' : 's'} found`}</span>
              <span>Newest first · {PAGE_SIZE} per page</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Actor</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                    <th className="px-5 py-3 font-semibold">Details</th>
                    <th className="px-5 py-3 font-semibold">IP address</th>
                    <th className="px-5 py-3 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map((record) => (
                    <tr key={record.id} className="text-sm">
                      <td className="whitespace-nowrap px-5 py-3">
                        <p className="font-medium text-gray-800">{record.actorName}</p>
                        <p className="text-xs capitalize text-gray-500">{record.actorRole}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium capitalize text-blue-700">{record.category}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-gray-700">{record.action}</td>
                      <td className="min-w-64 px-5 py-3 text-gray-600">{record.details || '—'}</td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-gray-500">{record.ipAddress || '—'}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-gray-500">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {!loading && records.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-500">
                        <Activity size={22} className="mx-auto mb-2 text-gray-400" />
                        No system events match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} />
          </>
        )}
      </section>
    </div>
  );
};

export default SystemLogs;
