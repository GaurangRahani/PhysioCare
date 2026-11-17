import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Plus,
  Loader2,
  Stethoscope,
  ChevronDown,
  X,
  FileText,
  FileSpreadsheet,
  Building2,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';

const DoctorAppointments = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date Range Filter ('today' | '7days' | '30days' | 'custom')
  const [dateRangeType, setDateRangeType] = useState('30days');
  
  // Custom Date Range State: Temp (drafted in inputs) vs Applied (triggered on click)
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting State (default by date desc)
  const [sortColumn, setSortColumn] = useState('appointment_date');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Multi-Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState('current'); // 'current', 'all', 'selected', 'search', 'date'
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'csv'
  const [isExporting, setIsExporting] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch appointments based on active date range
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      let queryParams = new URLSearchParams();
      if (dateRangeType === 'today') {
        queryParams.set('date', 'today');
      } else if (dateRangeType === '7days') {
        queryParams.set('range', '7days');
      } else if (dateRangeType === '30days') {
        queryParams.set('range', '30days');
      } else if (dateRangeType === 'custom' && appliedStartDate && appliedEndDate) {
        queryParams.set('startDate', appliedStartDate);
        queryParams.set('endDate', appliedEndDate);
      } else {
        queryParams.set('date', 'all');
      }

      const res = await fetch(`${apiUrl}/api/appointments?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments || []);
      } else {
        setError(data.message || 'Failed to fetch appointments.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while loading your appointments.');
    } finally {
      setLoading(false);
    }
  }, [getToken, dateRangeType, appliedStartDate, appliedEndDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Handle column sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Helper sort icon renderer
  const renderSortArrow = (column) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={12} className="text-[#8A8A8A] opacity-60" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} className="text-[#111111] font-bold" />
      : <ArrowDown size={12} className="text-[#111111] font-bold" />;
  };

  // Resolve visit type
  const getVisitType = (appt) => {
    if (appt.visit_type) return appt.visit_type;
    if (appt.notes && appt.notes.toLowerCase().includes('follow')) return 'Follow-up';
    return 'Initial Consultation';
  };

  // Filtered & Sorted Appointments
  const processedAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const matchPatient = (a.patient_name || '').toLowerCase().includes(q);
        const matchReason = (a.visit_reason || '').toLowerCase().includes(q);
        const matchType = getVisitType(a).toLowerCase().includes(q);
        const matchStatus = (a.status || '').toLowerCase().includes(q);
        const matchDate = (a.appointment_date || '').toLowerCase().includes(q);
        return matchPatient || matchReason || matchType || matchStatus || matchDate;
      })
      .sort((a, b) => {
        if (sortColumn === 'appointment_date') {
          const timeA = `${a.appointment_date || ''} ${a.start_time || ''}`;
          const timeB = `${b.appointment_date || ''} ${b.start_time || ''}`;
          return sortDirection === 'asc' ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
        }

        if (sortColumn === 'visit_type') {
          const typeA = getVisitType(a);
          const typeB = getVisitType(b);
          return sortDirection === 'asc' ? typeA.localeCompare(typeB) : typeB.localeCompare(typeA);
        }

        let valA = a[sortColumn] || '';
        let valB = b[sortColumn] || '';

        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
  }, [appointments, searchQuery, sortColumn, sortDirection]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(processedAppointments.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = processedAppointments.slice(indexOfFirstItem, indexOfLastItem);

  // Checkbox multi-select
  const handleSelectAllCurrentPage = (e) => {
    if (e.target.checked) {
      const pageIds = currentAppointments.map(a => a.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = currentAppointments.map(a => a.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isCurrentPageAllSelected = currentAppointments.length > 0 &&
    currentAppointments.every(a => selectedIds.includes(a.id));

  // Top Metrics Calculation
  const metrics = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const scheduled = appointments.filter(a => a.status === 'scheduled').length;
    const uniquePatients = new Set(appointments.map(a => a.patient_id).filter(Boolean)).size;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, scheduled, uniquePatients, rate };
  }, [appointments]);

  // Execute applied custom range
  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      setAppliedStartDate(tempStartDate);
      setAppliedEndDate(tempEndDate);
      setDateRangeType('custom');
      setIsDateDropdownOpen(false);
    }
  };

  // Export Implementation (PDF & CSV)
  const handleExecuteExport = () => {
    setIsExporting(true);

    let exportItems = [];
    if (exportScope === 'current') {
      exportItems = currentAppointments;
    } else if (exportScope === 'all') {
      exportItems = appointments;
    } else if (exportScope === 'selected') {
      exportItems = appointments.filter(a => selectedIds.includes(a.id));
    } else if (exportScope === 'search') {
      exportItems = processedAppointments;
    } else {
      exportItems = processedAppointments;
    }

    if (exportItems.length === 0) {
      alert('No appointments available in the selected export scope.');
      setIsExporting(false);
      return;
    }

    if (exportFormat === 'csv') {
      const headers = ['Date', 'Time Slot', 'Visit Type', 'Patient Name', 'Clinical Reason', 'Status', 'Payment Status'];
      const csvRows = [headers.join(',')];

      exportItems.forEach(item => {
        const row = [
          item.appointment_date || '',
          item.start_time ? item.start_time.substring(0, 5) : '',
          `"${getVisitType(item).replace(/"/g, '""')}"`,
          `"${(item.patient_name || 'Patient').replace(/"/g, '""')}"`,
          `"${(item.visit_reason || 'General Consultation').replace(/"/g, '""')}"`,
          item.status || '',
          item.payment_status || 'paid'
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', `AlignCare_Appointments_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // PDF Printable Document
      const printWindow = window.open('', '_blank');
      const tableRowsHtml = exportItems.map(item => `
        <tr style="border-bottom: 1px solid #EAEAEA;">
          <td style="padding: 10px 12px; font-weight: 600;">${item.appointment_date || ''} • ${item.start_time ? item.start_time.substring(0, 5) : ''}</td>
          <td style="padding: 10px 12px; font-weight: 500;">${getVisitType(item)}</td>
          <td style="padding: 10px 12px; font-weight: 600;">${item.patient_name || 'Patient'}</td>
          <td style="padding: 10px 12px;">${item.visit_reason || 'General Consultation'}</td>
          <td style="padding: 10px 12px; text-transform: uppercase; font-size: 11px;">${item.status}</td>
          <td style="padding: 10px 12px; text-transform: uppercase; font-size: 11px;">${item.payment_status || 'Paid'}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>AlignCare Clinical Appointments Ledger</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif; color: #202223; margin: 30px; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111111; padding-bottom: 15px; margin-bottom: 25px; }
              .title { font-size: 22px; font-weight: 700; margin: 0; }
              .meta { font-size: 12px; color: #616161; }
              table { width: 100%; border-collapse: collapse; font-size: 13px; }
              th { text-align: left; background-color: #F7F7F7; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #616161; border-bottom: 1px solid #E5E5E5; }
              @media print { body { margin: 15mm; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1 class="title">AlignCare Clinical Suite</h1>
                <div class="meta">Doctor Consultation & Appointment Ledger</div>
              </div>
              <div style="text-align: right;" class="meta">
                <div>Generated: ${new Date().toLocaleString()}</div>
                <div>Total Appointments: ${exportItems.length}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date & Slot</th>
                  <th>Visit Type</th>
                  <th>Patient</th>
                  <th>Clinical Reason</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }

    setIsExporting(false);
    setIsExportModalOpen(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#FFFFFF] font-['Inter',system-ui,sans-serif] text-[#202223] flex flex-col">
      
      {/* ── 1. Top Bar matching Shopify Orders Screenshot ──────────────── */}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAEAEA] bg-[#FFFFFF]">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[20px] font-semibold text-[#202223] tracking-tight m-0">
            Appointments
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg text-[12px] text-[#616161]">
            <Building2 size={13} className="text-[#8A8A8A]" />
            <span>All clinics</span>
          </div>
        </div>

        {/* Action Buttons: Export & Manage Availability */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="btn-secondary-saas flex items-center gap-1.5 text-[12px] py-1.5 px-3"
          >
            <Download size={13} className="text-[#616161]" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/doctor-dashboard/availability')}
            className="btn-primary-saas flex items-center gap-1.5 text-[12px] py-1.5 px-3"
          >
            <Plus size={13} />
            <span>Manage Availability</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Metrics Bar with Date Range Selector & Evenly Distributed Cards ─── */}
      <div className="px-6 py-3 border-b border-[#EAEAEA] flex flex-col md:flex-row items-stretch md:items-center gap-6 relative bg-[#FFFFFF] z-20">
        
        {/* Date Dropdown Pill on Left */}
        <div className="relative shrink-0" ref={dateDropdownRef}>
          <button
            type="button"
            onClick={() => {
              if (!isDateDropdownOpen) {
                // Initialize temp inputs with currently applied custom dates if any
                setTempStartDate(appliedStartDate);
                setTempEndDate(appliedEndDate);
              }
              setIsDateDropdownOpen(v => !v);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-[#FFFFFF] hover:bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg text-[13px] font-medium text-[#202223] transition-colors cursor-pointer"
          >
            <CalendarIcon size={14} className="text-[#616161]" />
            <span>
              {dateRangeType === 'today' ? 'Today' :
               dateRangeType === '7days' ? 'Last 7 days' :
               dateRangeType === '30days' ? 'Last 30 days' :
               appliedStartDate && appliedEndDate ? `${appliedStartDate} to ${appliedEndDate}` : 'Custom dates'}
            </span>
            <ChevronDown size={14} className="text-[#8A8A8A]" />
          </button>

          {/* Date Picker Popover Menu */}
          {isDateDropdownOpen && (
            <div className="absolute top-12 left-0 w-80 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl shadow-2xl p-3.5 z-50 flex flex-col gap-2.5 animate-fade-in text-[13px]">
              
              <label 
                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                  dateRangeType === 'today' ? 'bg-[#F7F7F7]' : 'hover:bg-[#FAFAFA]'
                }`}
                onClick={() => { setDateRangeType('today'); setIsDateDropdownOpen(false); }}
              >
                <input 
                  type="radio" 
                  name="dateRangeOption" 
                  checked={dateRangeType === 'today'} 
                  onChange={() => { setDateRangeType('today'); setIsDateDropdownOpen(false); }} 
                  className="mt-0.5 text-[#111111]"
                />
                <div>
                  <span className="font-semibold text-[#202223] block">Today</span>
                  <span className="text-[11px] text-[#8A8A8A] block">Compared to yesterday up to current hour</span>
                </div>
              </label>

              <label 
                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                  dateRangeType === '7days' ? 'bg-[#F7F7F7]' : 'hover:bg-[#FAFAFA]'
                }`}
                onClick={() => { setDateRangeType('7days'); setIsDateDropdownOpen(false); }}
              >
                <input 
                  type="radio" 
                  name="dateRangeOption" 
                  checked={dateRangeType === '7days'} 
                  onChange={() => { setDateRangeType('7days'); setIsDateDropdownOpen(false); }} 
                  className="mt-0.5 text-[#111111]"
                />
                <div>
                  <span className="font-semibold text-[#202223] block">Last 7 days</span>
                  <span className="text-[11px] text-[#8A8A8A] block">Compared to the previous 7 days</span>
                </div>
              </label>

              <label 
                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                  dateRangeType === '30days' ? 'bg-[#F7F7F7]' : 'hover:bg-[#FAFAFA]'
                }`}
                onClick={() => { setDateRangeType('30days'); setIsDateDropdownOpen(false); }}
              >
                <input 
                  type="radio" 
                  name="dateRangeOption" 
                  checked={dateRangeType === '30days'} 
                  onChange={() => { setDateRangeType('30days'); setIsDateDropdownOpen(false); }} 
                  className="mt-0.5 text-[#111111]"
                />
                <div>
                  <span className="font-semibold text-[#202223] block">Last 30 days</span>
                  <span className="text-[11px] text-[#8A8A8A] block">Compared to the previous 30 days</span>
                </div>
              </label>

              {/* Custom Date Range Option */}
              <div className="pt-2 border-t border-[#EAEAEA] flex flex-col gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Custom Date Range
                </span>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <label className="text-[11px] text-[#616161] block mb-0.5">Start Date</label>
                    <input 
                      type="date"
                      value={tempStartDate}
                      onChange={e => setTempStartDate(e.target.value)}
                      className="w-full px-2 py-1 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[12px] font-mono outline-none focus:border-[#202223]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#616161] block mb-0.5">End Date</label>
                    <input 
                      type="date"
                      value={tempEndDate}
                      onChange={e => setTempEndDate(e.target.value)}
                      className="w-full px-2 py-1 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[12px] font-mono outline-none focus:border-[#202223]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!tempStartDate || !tempEndDate}
                  onClick={handleApplyCustomRange}
                  className="w-full py-1.5 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] text-[12px] font-medium rounded-lg disabled:opacity-40 transition-colors cursor-pointer mt-1 shadow-xs"
                >
                  Apply Custom Range
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Metrics Grid across the Entire Screen */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-[#EAEAEA] text-[12px]">
          <div className="flex flex-col pl-4">
            <span className="text-[#8A8A8A] text-[11px] font-medium">Appointments</span>
            <span className="text-[16px] font-semibold text-[#202223] font-mono mt-0.5">
              {metrics.total}
            </span>
            <div className="w-16 h-0.5 bg-[#4088F8] mt-1.5 rounded-full" />
          </div>

          <div className="flex flex-col pl-4">
            <span className="text-[#8A8A8A] text-[11px] font-medium">Completed</span>
            <span className="text-[16px] font-semibold text-[#202223] font-mono mt-0.5">
              {metrics.completed}
            </span>
            <div className="w-16 h-0.5 bg-[#A3F56C] mt-1.5 rounded-full" />
          </div>

          <div className="flex flex-col pl-4">
            <span className="text-[#8A8A8A] text-[11px] font-medium">Scheduled</span>
            <span className="text-[16px] font-semibold text-[#202223] font-mono mt-0.5">
              {metrics.scheduled}
            </span>
            <div className="w-16 h-0.5 bg-[#F5C451] mt-1.5 rounded-full" />
          </div>

          <div className="flex flex-col pl-4">
            <span className="text-[#8A8A8A] text-[11px] font-medium">Patients Seen</span>
            <span className="text-[16px] font-semibold text-[#202223] font-mono mt-0.5">
              {metrics.uniquePatients}
            </span>
            <div className="w-16 h-0.5 bg-[#D1D1D1] mt-1.5 rounded-full" />
          </div>

          <div className="flex flex-col pl-4">
            <span className="text-[#8A8A8A] text-[11px] font-medium">Completion Rate</span>
            <span className="text-[16px] font-semibold text-[#202223] font-mono mt-0.5">
              {metrics.rate}%
            </span>
            <div className="w-16 h-0.5 bg-[#111111] mt-1.5 rounded-full" />
          </div>
        </div>

      </div>

      {/* ── 3. Single-Line Table Toolbar (Matching screenshot: "All | 🔍 Search and filter") ── */}
      <div className="px-6 py-2.5 border-b border-[#EAEAEA] flex items-center justify-between gap-4 bg-[#FFFFFF]">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            type="button"
            className="text-[13px] font-semibold text-[#202223] px-2.5 py-1 rounded-md bg-[#F4F4F4]"
          >
            All
          </button>
          <div className="h-4 w-px bg-[#E5E5E5]" />
          
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
            <input
              type="text"
              placeholder="Search and filter..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg text-[#202223] placeholder-[#8A8A8A] outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#8A8A8A]">
          <button 
            type="button"
            title="Table View Settings"
            className="p-1.5 hover:text-[#202223] rounded-md hover:bg-[#F5F5F5] transition-colors"
          >
            <SlidersHorizontal size={15} />
          </button>
          <button 
            type="button"
            title="Saved Views"
            className="p-1.5 hover:text-[#202223] rounded-md hover:bg-[#F5F5F5] transition-colors"
          >
            <Bookmark size={15} />
          </button>
        </div>
      </div>

      {/* ── 4. Full Width Pure Table with Proportional Balanced Columns ─── */}
      <div className="w-full overflow-x-auto flex-1 bg-[#FFFFFF]">
        <table className="w-full text-left text-[13px] border-collapse bg-[#FFFFFF]">
          <thead>
            <tr className="border-b border-[#EAEAEA] bg-[#FFFFFF] text-[#8A8A8A] text-[11px] font-semibold uppercase tracking-wider select-none">
              {/* Checkbox (Fixed narrow width) */}
              <th className="py-3 px-6 w-12">
                <input
                  type="checkbox"
                  checked={isCurrentPageAllSelected}
                  onChange={handleSelectAllCurrentPage}
                  className="rounded border-[#CCCCCC] text-[#111111] focus:ring-0 cursor-pointer"
                />
              </th>

              {/* 1st Column: Date with slot (~18%) */}
              <th 
                className="py-3 px-4 w-[18%] cursor-pointer hover:text-[#202223] transition-colors"
                onClick={() => handleSort('appointment_date')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Date & Slot</span>
                  {renderSortArrow('appointment_date')}
                </div>
              </th>

              {/* 2nd Column: Visit Type (~15%) */}
              <th 
                className="py-3 px-4 w-[15%] cursor-pointer hover:text-[#202223] transition-colors"
                onClick={() => handleSort('visit_type')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Visit Type</span>
                  {renderSortArrow('visit_type')}
                </div>
              </th>

              {/* 3rd Column: Patient (~16%) */}
              <th 
                className="py-3 px-4 w-[16%] cursor-pointer hover:text-[#202223] transition-colors"
                onClick={() => handleSort('patient_name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Patient</span>
                  {renderSortArrow('patient_name')}
                </div>
              </th>

              {/* 4th Column: Clinical Reason (~22%) */}
              <th 
                className="py-3 px-4 w-[22%] cursor-pointer hover:text-[#202223] transition-colors"
                onClick={() => handleSort('visit_reason')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Clinical Reason</span>
                  {renderSortArrow('visit_reason')}
                </div>
              </th>

              {/* 5th Column: Status (~11%) */}
              <th 
                className="py-3 px-4 w-[11%] cursor-pointer hover:text-[#202223] transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {renderSortArrow('status')}
                </div>
              </th>

              {/* 6th Column: Payment (~8%) */}
              <th 
                className="py-3 px-4 w-[8%] cursor-pointer hover:text-[#202223] transition-colors"
                onClick={() => handleSort('payment_status')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Payment</span>
                  {renderSortArrow('payment_status')}
                </div>
              </th>

              {/* 7th Column: Actions (~10%) */}
              <th className="py-3 px-6 w-[10%] text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0F0F0] bg-[#FFFFFF]">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-[#8A8A8A]">
                  <Loader2 size={24} className="animate-spin text-[#202223] mx-auto mb-2" />
                  <span className="text-[13px]">Loading consultations and appointments...</span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#B42318] bg-[#FCE4E4]">
                  {error}
                </td>
              </tr>
            ) : currentAppointments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-[#8A8A8A]">
                  <CalendarIcon size={24} className="mx-auto mb-2 text-[#CCCCCC]" />
                  <span className="text-[14px] font-medium text-[#202223] block">No appointments found</span>
                  <span className="text-[12px] text-[#616161] mt-0.5 block">
                    {searchQuery ? `No results matching "${searchQuery}"` : 'No appointments recorded for this timeframe.'}
                  </span>
                </td>
              </tr>
            ) : (
              currentAppointments.map((appt) => {
                const isSelected = selectedIds.includes(appt.id);
                const isCompleted = appt.status === 'completed';
                const visitType = getVisitType(appt);

                return (
                  <tr
                    key={appt.id}
                    className={`hover:bg-[#F9F9F9] transition-colors ${
                      isSelected ? 'bg-[#FAFAFA]' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-6">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(appt.id)}
                        className="rounded border-[#CCCCCC] text-[#111111] focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* 1st: Date with Slot */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="text-[#202223] font-medium">
                          {new Date(appt.appointment_date).toLocaleDateString('en-GB', { 
                            day: 'numeric', month: 'short', year: 'numeric' 
                          })}
                        </span>
                        <span className="text-[11px] font-mono text-[#8A8A8A]">
                          {appt.start_time ? appt.start_time.substring(0, 5) : '—'} • 30 mins
                        </span>
                      </div>
                    </td>

                    {/* 2nd: Visit Type */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-medium bg-[#F5F5F5] text-[#202223] border border-[#EBEBEB]">
                        {visitType}
                      </span>
                    </td>

                    {/* 3rd: Patient Name */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => appt.patient_id && navigate(`/doctor-dashboard/patients/${appt.patient_id}`)}
                        className="font-semibold text-[#202223] hover:underline text-left cursor-pointer"
                      >
                        {appt.patient_name || 'Patient'}
                      </button>
                    </td>

                    {/* 4th: Clinical Reason */}
                    <td className="py-3.5 px-4 text-[#616161]">
                      {appt.visit_reason || 'General Clinical Review'}
                    </td>

                    {/* 5th: Status */}
                    <td className="py-3.5 px-4">
                      {isCompleted ? (
                        <span className="badge-semantic-success text-[11px] font-medium">
                          Completed
                        </span>
                      ) : appt.status === 'scheduled' ? (
                        <span className="badge-semantic-warning text-[11px] font-medium">
                          Scheduled
                        </span>
                      ) : (
                        <span className="badge-semantic-neutral text-[11px] font-medium capitalize">
                          {appt.status}
                        </span>
                      )}
                    </td>

                    {/* 6th: Payment */}
                    <td className="py-3.5 px-4">
                      <span className="badge-semantic-success text-[11px] font-medium">
                        Paid
                      </span>
                    </td>

                    {/* 7th: Actions */}
                    <td className="py-3.5 px-6 text-right">
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/doctor-dashboard/patients/${appt.patient_id}?tab=history`)}
                          className="btn-secondary-saas text-[11px] py-1 px-2.5"
                        >
                          View Record
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/doctor-dashboard/consultation/${appt.id}`, { state: { appointment: appt } })}
                          className="btn-primary-saas text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                        >
                          <Stethoscope size={11} />
                          <span>Start Visit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── 5. Full Width Table Footer & Pagination ─────────────────── */}
      {!loading && processedAppointments.length > 0 && (
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#EAEAEA] text-[12px] text-[#616161] bg-[#FFFFFF]">
          <div className="flex items-center gap-2">
            <span>Show:</span>
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 bg-[#FFFFFF] border border-[#E5E5E5] rounded-md text-[#202223] font-medium outline-none cursor-pointer"
            >
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>
            <span className="text-[#8A8A8A] ml-2">
              Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, processedAppointments.length)} of {processedAppointments.length} appointments
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#202223] font-medium hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            
            <span className="px-2 font-mono text-[#202223]">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#202223] font-medium hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── 6. EXPORT APPOINTMENTS MODAL (Matching Image 3 Demo) ───────── */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Inter',system-ui,sans-serif]">
          <div 
            className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E5] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-[#FAFAFA]">
              <h3 className="text-[16px] font-semibold text-[#202223] m-0">
                Export appointments
              </h3>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-[#616161] hover:text-[#202223] hover:bg-[#F0F0F0] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5 text-[13px]">
              
              {/* Group 1: Export Scope */}
              <div>
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-2">
                  Export
                </span>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'current'}
                      onChange={() => setExportScope('current')}
                      className="text-[#111111] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[#202223]">Current page ({currentAppointments.length} appointments)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      className="text-[#111111] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[#202223]">All appointments ({appointments.length} total)</span>
                  </label>

                  <label className={`flex items-center gap-2.5 ${selectedIds.length === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      name="exportScope"
                      disabled={selectedIds.length === 0}
                      checked={exportScope === 'selected'}
                      onChange={() => setExportScope('selected')}
                      className="text-[#111111] focus:ring-0"
                    />
                    <span className="text-[#202223]">Selected: {selectedIds.length} appointments</span>
                  </label>

                  <label className={`flex items-center gap-2.5 ${!searchQuery ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="radio"
                      name="exportScope"
                      disabled={!searchQuery}
                      checked={exportScope === 'search'}
                      onChange={() => setExportScope('search')}
                      className="text-[#111111] focus:ring-0"
                    />
                    <span className="text-[#202223]">Appointments matching search ({processedAppointments.length})</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'date'}
                      onChange={() => setExportScope('date')}
                      className="text-[#111111] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[#202223]">Appointments in active date filter</span>
                  </label>
                </div>
              </div>

              {/* Group 2: Export As Format */}
              <div className="pt-3 border-t border-[#EAEAEA]">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-2">
                  Export as
                </span>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      checked={exportFormat === 'pdf'}
                      onChange={() => setExportFormat('pdf')}
                      className="text-[#111111] focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-[#202223]">
                      <FileText size={15} className="text-[#4088F8]" />
                      <span>PDF Clinical Report (printable & downloadable document)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')}
                      className="text-[#111111] focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 text-[#202223]">
                      <FileSpreadsheet size={15} className="text-[#245B19]" />
                      <span>CSV for Excel, Numbers, or other spreadsheet programs</span>
                    </div>
                  </label>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="btn-secondary-saas text-[12px]"
                disabled={isExporting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteExport}
                disabled={isExporting}
                className="btn-primary-saas text-[12px] flex items-center gap-1.5"
              >
                {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                <span>Export appointments</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorAppointments;
