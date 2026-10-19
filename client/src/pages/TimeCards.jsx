import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TimeCards = ({ user }) => {
  const [timeCard, setTimeCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadMenu, setDownloadMenu] = useState(false);
  const [error, setError] = useState('');

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const timeCardRef = useRef(null);
  const dropdownRef = useRef(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // ============ RWANDA PUBLIC HOLIDAYS ============
  const FIXED_HOLIDAYS = {
    '01-01': "New Year's Day",
    '01-02': "Day after New Year",
    '02-01': "National Heroes' Day",
    '04-07': 'Genocide Memorial Day',
    '05-01': 'Labour Day',
    '07-01': 'Independence Day',
    '07-04': 'Liberation Day',
    '08-15': 'Assumption Day',
    '12-25': 'Christmas Day',
    '12-26': 'Boxing Day',
  };

  const MOVEABLE_HOLIDAYS = {
    '2026-04-03': 'Good Friday',
    '2026-04-06': 'Easter Monday',
    '2026-05-14': 'Eid al-Fitr',
    '2026-06-16': 'Day of the African Child',
    '2026-07-20': 'Eid al-Adha',
    '2026-11-25': 'Umuganura Day',
  };

  const getHolidayName = (day, month, year) => {
    const mmdd = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const yyyymmdd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (MOVEABLE_HOLIDAYS[yyyymmdd]) return MOVEABLE_HOLIDAYS[yyyymmdd];
    if (FIXED_HOLIDAYS[mmdd]) return FIXED_HOLIDAYS[mmdd];
    return null;
  };

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

  const calcHoursFromTimes = (entry, departure) => {
    if (!entry || !departure) return 0;
    try {
      const [eh, em] = entry.split(':').map(Number);
      const [dh, dm] = departure.split(':').map(Number);
      const start = eh * 60 + em;
      const end = dh * 60 + dm;
      const diff = end - start;
      return diff > 0 ? diff / 60 : 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDownloadMenu(false);
      }
    };
    if (downloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [downloadMenu]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    axios
      .get(`http://localhost:5000/api/timecard/${user.id}/${currentYear}/${currentMonth}`)
      .then((res) => {
        if (!cancelled) {
          setTimeCard(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Time card fetch error:', err);
          setError(err.response?.data?.error || 'Failed to load time card.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [user?.id, currentMonth, currentYear]);

  const changeMonth = (delta) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const buildFilename = (ext) => {
    if (!timeCard) return `TimeCard.${ext}`;
    const name = timeCard.employee.name.replace(/\s+/g, '_');
    const month = monthNames[currentMonth - 1];
    return `TimeCard_${name}_${month}_${currentYear}.${ext}`;
  };

  const safeHtml2Canvas = async (element) => {
    element.classList.add('html2canvas-fix');
    try {
      return await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
    } finally {
      element.classList.remove('html2canvas-fix');
    }
  };

  const downloadPDF = async () => {
    if (!timeCardRef.current) return;
    setDownloading(true);
    setDownloadMenu(false);
    try {
      const canvas = await safeHtml2Canvas(timeCardRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pdfHeight - 10) {
        pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 5;
        pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 10;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight + 5;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight - 10;
        }
      }
      pdf.save(buildFilename('pdf'));
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate PDF. Try CSV or Image instead.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadPNG = async () => {
    if (!timeCardRef.current) return;
    setDownloading(true);
    setDownloadMenu(false);
    try {
      const canvas = await safeHtml2Canvas(timeCardRef.current);
      const link = document.createElement('a');
      link.download = buildFilename('png');
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const downloadCSV = () => {
    if (!timeCard) return;
    setDownloadMenu(false);
    const { employee, days, totalHoursMonth } = timeCard;

    const rows = [
      ['MOTA-ENGIL AFRICA - TIME CARD'],
      ['COMPANY', 'Mota-Engil Africa'],
      ['MONTH', `${monthNames[currentMonth - 1]} ${currentYear}`],
      ['NUMBER', employee.badge_id || employee.id],
      ['NAME', employee.name],
      ['COST CENTER', employee.department],
      [],
      ['Days', 'Entry Time', 'Departure Time', 'Total Hours', 'Day Type'],
    ];

    days.forEach((d) => {
      const dateObj = new Date(currentYear, currentMonth - 1, d.day);
      const dow = dateObj.getDay();
      const holiday = getHolidayName(d.day, currentMonth, currentYear);
      let dayType = 'Workday';
      if (holiday) dayType = `Holiday: ${holiday}`;
      else if (dow === 0) dayType = 'Sunday';
      else if (dow === 6) dayType = 'Saturday';

      rows.push([
        String(d.day).padStart(2, '0'),
        d.entryTime || '',
        d.departureTime || '',
        d.totalHours ? formatHours(d.totalHours) : '',
        dayType,
      ]);
    });

    rows.push([]);
    rows.push(['', '', 'TOTAL HOURS', formatHours(totalHoursMonth), '']);

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = buildFilename('csv');
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !timeCard) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium">{error || 'No data available.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const { employee, days, totalHoursMonth } = timeCard;

  const workDays = days.filter(d => d.entryTime);
  const totalDaysWorked = workDays.length;
  const totalDecimalHours = Number(totalHoursMonth) || 0;
  const averagePerDay = totalDaysWorked > 0 ? totalDecimalHours / totalDaysWorked : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* ============ CONTROLS ============ */}
      <div className="no-print flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Time Card</h1>
          <p className="text-sm text-gray-500">
            {employee.name} · {employee.department}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-gray-800 min-w-[180px] text-center">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Printer size={16} /> <span>Print</span>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDownloadMenu((p) => !p)}
              disabled={downloading}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {downloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download size={16} /> <span>Download</span>
                </>
              )}
            </button>

            {downloadMenu && !downloading && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                <button
                  onClick={downloadPDF}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
                >
                  <Download size={16} className="text-red-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-800">Download as PDF</p>
                    <p className="text-xs text-gray-500">Best for printing</p>
                  </div>
                </button>
                <button
                  onClick={downloadCSV}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left border-t border-gray-100 transition-colors"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-800">Download as Excel (CSV)</p>
                    <p className="text-xs text-gray-500">Open in Excel</p>
                  </div>
                </button>
                <button
                  onClick={downloadPNG}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 text-left border-t border-gray-100 transition-colors"
                >
                  <ImageIcon size={16} className="text-purple-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-800">Download as Image</p>
                    <p className="text-xs text-gray-500">PNG format</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ SUMMARY CARDS ============ */}
      <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-xs text-gray-500 uppercase font-medium">Days Worked</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalDaysWorked}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-xs text-gray-500 uppercase font-medium">Total Hours</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatHours(totalDecimalHours)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-xs text-gray-500 uppercase font-medium">Average / Day</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatHours(averagePerDay)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-xs text-gray-500 uppercase font-medium">Days Absent</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {days.length - totalDaysWorked - days.filter(d => {
              const dow = new Date(currentYear, currentMonth - 1, d.day).getDay();
              return dow === 0 || dow === 6;
            }).length}
          </p>
        </div>
      </div>

      {/* ============ TIME CARD ============ */}
      <div
        ref={timeCardRef}
        className="time-card bg-white p-8 rounded-lg shadow-lg border-2 border-gray-300 print:shadow-none print:border-0 print:p-0"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-gray-800">
          <div className="flex items-center space-x-3">
            <img
              src="/mota-engil-africa-logo.jpg"
              alt="Mota-Engil Africa"
              className="h-16 w-40 object-contain"
            />
          </div>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-wide">TIME CARD</h1>
          </div>
          <div className="text-right text-[10px] text-gray-600">
            <div>Doc. Ref: ME-TC-001</div>
            <div>Rev: 02</div>
          </div>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div>
            <div className="flex border-b border-gray-400 pb-1 mb-1">
              <span className="font-bold text-gray-700 w-28">COMPANY:</span>
              <span className="flex-1 text-gray-900">Mota-Engil Africa</span>
            </div>
            <div className="flex border-b border-gray-400 pb-1 mb-1">
              <span className="font-bold text-gray-700 w-28">NUMBER:</span>
              <span className="flex-1 text-gray-900">{employee.badge_id || employee.id}</span>
            </div>
            <div className="flex border-b border-gray-400 pb-1 mb-1">
              <span className="font-bold text-gray-700 w-28">COST CENTER:</span>
              <span className="flex-1 text-gray-900">{employee.department?.toUpperCase()}</span>
            </div>
          </div>
          <div>
            <div className="flex border-b border-gray-400 pb-1 mb-1">
              <span className="font-bold text-gray-700 w-28">MONTH:</span>
              <span className="flex-1 text-gray-900">{monthNames[currentMonth - 1].toUpperCase()} {currentYear}</span>
            </div>
            <div className="flex border-b border-gray-400 pb-1 mb-1">
              <span className="font-bold text-gray-700 w-28">NAME:</span>
              <span className="flex-1 text-gray-900">{employee.name.toUpperCase()}</span>
            </div>
            <div className="flex border-b border-gray-400 pb-1 mb-1">
              <span className="font-bold text-gray-700 w-28">CATEGORY:</span>
              <span className="flex-1 text-gray-900">{employee.department?.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* ============ COLOR LEGEND ============ */}
        <div className="flex flex-wrap gap-4 mb-3 text-[10px] items-center">
          <span className="font-semibold text-gray-700">Legend:</span>

          <div className="flex items-center space-x-1">
            <div className="w-4 h-3 border-l-4 border-amber-500 bg-amber-100"></div>
            <span className="text-gray-600 font-medium">Public Holiday</span>
          </div>

          <div className="flex items-center space-x-1">
            <div className="w-4 h-3 border-l-4 border-pink-400 bg-pink-100"></div>
            <span className="text-gray-600 font-medium">Weekend</span>
          </div>

          <div className="flex items-center space-x-1">
            <div className="w-4 h-3 border-l-4 border-red-500 bg-red-100"></div>
            <span className="text-gray-600 font-medium">Absent</span>
          </div>

          <div className="flex items-center space-x-1">
            <div className="w-4 h-3 border-l-4 border-gray-300 bg-white"></div>
            <span className="text-gray-600 font-medium">Workday</span>
          </div>
        </div>

        {/* ============ TABLE ============ */}
        <table className="w-full border-2 border-gray-800 text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-800 p-1 font-bold">Days</th>
              <th className="border border-gray-800 p-1 font-bold">Entry<br />Time</th>
              <th className="border border-gray-800 p-1 font-bold">Departure<br />Time</th>
              <th className="border border-gray-800 p-1 font-bold">Employee's<br />signature</th>
              <th className="border border-gray-800 p-1 font-bold">Total<br />Hours</th>
              <th className="border border-gray-800 p-1 font-bold">Supervisor's<br />signature</th>
              <th className="border border-gray-800 p-1 font-bold">Area</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const dateObj = new Date(currentYear, currentMonth - 1, d.day);
              const dow = dateObj.getDay();
              const isSaturday = dow === 6;
              const isSunday = dow === 0;
              const isWeekend = isSaturday || isSunday;

              const holidayName = getHolidayName(d.day, currentMonth, currentYear);
              const isHoliday = !!holidayName;

              const isAbsent = !d.entryTime && !isWeekend && !isHoliday;

              // ============ ROW COLOR PRIORITY ============
              // Holiday (amber) > Weekend (pink) > Absent (red) > Workday (white)
              let rowStyle = {
                backgroundColor: '#ffffff',
                borderLeft: '4px solid #d1d5db',
              };

              if (isHoliday) {
                rowStyle = {
                  backgroundColor: '#fef3c7',
                  borderLeft: '4px solid #f59e0b',
                };
              } else if (isWeekend) {
                rowStyle = {
                  backgroundColor: '#fce7f3',
                  borderLeft: '4px solid #f472b6',
                };
              } else if (isAbsent) {
                rowStyle = {
                  backgroundColor: '#fee2e2',
                  borderLeft: '4px solid #ef4444',
                };
              }

              const hoursDecimal = d.totalHours
                ? Number(d.totalHours)
                : calcHoursFromTimes(d.entryTime, d.departureTime);

              return (
                <tr
                  key={d.day}
                  style={rowStyle}
                  title={holidayName || ''}
                >
                  <td className="border border-gray-800 p-1 text-center font-medium align-middle">
                    <div className="flex flex-col items-center justify-center">
                      <span>{String(d.day).padStart(2, '0')}</span>
                      {isHoliday && (
                        <span className="text-[8px] text-amber-900 font-bold leading-none mt-0.5">
                          ★ HOLIDAY
                        </span>
                      )}
                      {isWeekend && !isHoliday && (
                        <span className="text-[8px] text-pink-800 font-semibold leading-none mt-0.5">
                          {isSaturday ? 'SAT' : 'SUN'}
                        </span>
                      )}
                      {isAbsent && (
                        <span className="text-[8px] text-red-800 font-semibold leading-none mt-0.5">
                          ABSENT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-800 p-1 text-center h-6 font-mono">
                    {d.entryTime || ''}
                  </td>
                  <td className="border border-gray-800 p-1 text-center font-mono">
                    {d.departureTime || ''}
                  </td>
                  <td className="border border-gray-800 p-1 text-center italic text-blue-800">
                    {d.entryTime ? '✓' : ''}
                  </td>
                  <td className="border border-gray-800 p-1 text-center font-bold">
                    {hoursDecimal > 0 ? formatHours(hoursDecimal) : ''}
                  </td>
                  <td className="border border-gray-800 p-1 text-center italic text-blue-800">
                    {d.supervisorSignature ? '✓' : ''}
                  </td>
                  <td className="border border-gray-800 p-1 text-center">{d.area}</td>
                </tr>
              );
            })}

            {/* Grand Total Row */}
            <tr className="bg-gray-200 font-bold">
              <td colSpan="4" className="border border-gray-800 p-2 text-right text-sm">
                TOTAL HOURS FOR THE MONTH:
              </td>
              <td className="border border-gray-800 p-2 text-center text-base text-green-700">
                {formatHours(totalDecimalHours)}
              </td>
              <td colSpan="2" className="border border-gray-800 p-2"></td>
            </tr>

            {/* Breakdown Row */}
            <tr className="bg-gray-100 text-xs">
              <td colSpan="4" className="border border-gray-800 p-2 text-right text-gray-600">
                Breakdown:
              </td>
              <td colSpan="3" className="border border-gray-800 p-2 text-left text-gray-600">
                {totalDaysWorked} days × {formatHours(averagePerDay)} average
                {' '}({totalDecimalHours.toFixed(2)} decimal hours)
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-8 text-xs">
          <div className="text-center">
            <div className="border-t border-gray-800 pt-1 mt-12">
              <span className="font-bold">Employee's Signature</span>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-800 pt-1 mt-12">
              <span className="font-bold">Supervisor's Signature</span>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-800 pt-1 mt-12">
              <span className="font-bold">HR Approval</span>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] text-gray-500 mt-6">
          Generated by E-igipande System · Mota-Engil Africa · {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default TimeCards;