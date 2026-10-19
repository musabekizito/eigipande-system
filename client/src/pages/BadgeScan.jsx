import React, { useState } from 'react';
import axios from 'axios';
import { Clock8, CheckCircle, XCircle } from 'lucide-react';

const BadgeScan = ({ isManager = false }) => {
  const [badgeId, setBadgeId] = useState('');
  const [message, setMessage] = useState(null);
  const [scanning, setScanning] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!badgeId.trim()) return;
    setScanning(true);
    try {
      const res = await axios.post('http://localhost:5000/api/badge/scan', { badge_id: badgeId });
      setMessage({ type: 'success', text: `${res.data.user} — ${res.data.action === 'clocked-in' ? 'Clocked In' : 'Clocked Out'}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Badge not recognized' });
    }
    setBadgeId('');
    setScanning(false);
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#0a3d6b] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-12 w-full max-w-lg text-center">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Clock8 size={32} className="text-[#0a3d6b]" />
          <h1 className="text-2xl font-bold text-[#0a3d6b]">E-igipande</h1>
        </div>

        <div className="border-4 border-dashed border-blue-200 rounded-2xl p-8 mb-6">
          <div className="text-blue-500 mb-4 flex justify-center">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 10h18M7 15h2M13 15h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {isManager ? 'Scan or enter a badge ID' : 'Please tap your badge card'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {isManager ? 'Scan an RFID badge or enter its ID to clock in or out' : 'Scan your RFID badge to clock in or out'}
          </p>

          <form onSubmit={handleScan} className="flex flex-col items-center space-y-3">
            <input
              autoFocus
              aria-label={isManager ? 'Enter or scan Badge ID' : 'Scan employee badge'}
              tabIndex={isManager ? 0 : -1}
              type="text"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              placeholder={isManager ? 'Enter or scan Badge ID' : undefined}
              className={isManager
                ? 'w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-center text-lg focus:border-blue-500 outline-none'
                : 'sr-only'}
            />
            {isManager && (
              <button type="submit" disabled={scanning}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2 rounded-lg">
                {scanning ? 'Processing...' : 'Submit'}
              </button>
            )}
          </form>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center justify-center space-x-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center space-x-2 text-green-600 text-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Waiting for card...</span>
        </div>
      </div>
    </div>
  );
};

export default BadgeScan;