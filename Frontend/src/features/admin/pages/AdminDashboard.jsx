import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  Calendar as CalendarIcon, 
  CreditCard, 
  Users, 
  UserPlus, 
  Clock, 
  CheckCircle2, 
  CalendarCheck, 
  RefreshCw, 
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  X,
  SlidersHorizontal,
  Receipt,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatINR = (n) =>
  Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const timeAgo = (iso) => {
  if (!iso) return 'Just now';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const SkeletonCard = () => (
  <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-5 shadow-xs animate-pulse">
    <div className="w-9 h-9 rounded-[8px] bg-[#F0F0F0] mb-3" />
    <div className="h-7 w-24 bg-[#F0F0F0] rounded-[6px] mb-2" />
    <div className="h-4 w-32 bg-[#F5F5F5] rounded-[4px] mb-1" />
    <div className="h-3 w-20 bg-[#F5F5F5] rounded-[4px]" />
  </div>
);

const AdminDashboard = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── AUDIT TRAIL FILTERING & CONTROLS (matching Doctor Appointments) ──
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'payment' | 'appointment' | 'new_patient'
  
  // Date Range Filter ('all' | 'today' | '7days' | '30days' | 'custom')
  const [dateRangeType, setDateRangeType] = useState('all');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  // Sorting
  const [sortColumn, setSortColumn] = useState('event_time'); // 'event_time' | 'event_type' | 'patient_name' | 'amount'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Error fetching admin overview:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [getToken]);

  const stats = data?.stats || {};
  const today = data?.today || {};
  const allActivities = data?.recent_activity || [];

  // ── FILTER & SORT PIPELINE ──────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    let result = [...allActivities];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const patientMatch = (item.patient_name || '').toLowerCase().includes(q);
        const doctorMatch = (item.doctor_name || '').toLowerCase().includes(q);
        const detailMatch = (item.detail || '').toLowerCase().includes(q);
        const typeMatch = (item.event_type || '').toLowerCase().includes(q);
        const amountMatch = item.amount ? String(item.amount).includes(q) : false;
        return patientMatch || doctorMatch || detailMatch || typeMatch || amountMatch;
      });
    }

    // 2. Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'payment') {
        result = result.filter(item => item.event_type === 'payment_received');
      } else if (typeFilter === 'appointment') {
        result = result.filter(item => item.event_type === 'appointment_booked');
      } else if (typeFilter === 'new_patient') {
        result = result.filter(item => item.event_type === 'new_patient');
      }
    }

    // 3. Date range filter
    if (dateRangeType !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      if (dateRangeType === 'today') {
        result = result.filter(item => new Date(item.event_time).getTime() >= todayStart);
      } else if (dateRangeType === '7days') {
        const past7Days = todayStart - 7 * 24 * 60 * 60 * 1000;
        result = result.filter(item => new Date(item.event_time).getTime() >= past7Days);
      } else if (dateRangeType === '30days') {
        const past30Days = todayStart - 30 * 24 * 60 * 60 * 1000;
        result = result.filter(item => new Date(item.event_time).getTime() >= past30Days);
      } else if (dateRangeType === 'custom' && appliedStartDate && appliedEndDate) {
        const start = new Date(appliedStartDate).getTime();
        const end = new Date(appliedEndDate).setHours(23, 59, 59, 999);
        result = result.filter(item => {
          const t = new Date(item.event_time).getTime();
          return t >= start && t <= end;
        });
      }
    }

    // 4. Sorting
    result.sort((a, b) => {
      let valA, valB;
      if (sortColumn === 'event_time') {
        valA = new Date(a.event_time || 0).getTime();
        valB = new Date(b.event_time || 0).getTime();
      } else if (sortColumn === 'amount') {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
      } else if (sortColumn === 'patient_name') {
        valA = (a.patient_name || '').toLowerCase();
        valB = (b.patient_name || '').toLowerCase();
      } else if (sortColumn === 'event_type') {
        valA = (a.event_type || '').toLowerCase();
        valB = (b.event_type || '').toLowerCase();
      } else {
        valA = a[sortColumn] || '';
        valB = b[sortColumn] || '';
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [allActivities, searchQuery, typeFilter, dateRangeType, appliedStartDate, appliedEndDate, sortColumn, sortDirection]);

  // Handle column sorting toggle
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setDateRangeType('all');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setTempStartDate('');
    setTempEndDate('');
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredActivities.length === 0) return;
    const headers = ['Event Type', 'Patient Name', 'Doctor/Detail', 'Amount (INR)', 'Date & Time'];
    const rows = filteredActivities.map(item => [
      item.event_type,
      `"${item.patient_name || ''}"`,
      `"${item.detail || item.doctor_name || ''}"`,
      item.amount || '0',
      `"${new Date(item.event_time).toLocaleString('en-IN')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AlignCare_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination slicing
  const totalEntries = filteredActivities.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedActivities = filteredActivities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Type Counts for badges
  const paymentCount = allActivities.filter(a => a.event_type === 'payment_received').length;
  const apptCount = allActivities.filter(a => a.event_type === 'appointment_booked').length;
  const ptCount = allActivities.filter(a => a.event_type === 'new_patient').length;

  const isFiltered = searchQuery || typeFilter !== 'all' || dateRangeType !== 'all';

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* ── 1. PAGE HEADER ROW ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-[20px] font-bold text-[#202223] tracking-tight">
            Executive Overview
          </h1>
          <p className="text-[12px] text-[#616161] mt-0.5">
            Real-time operational metrics, clinic capacity, revenue collections, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => loadData(true)}
            disabled={loading || isRefreshing}
            className="h-[34px] px-3 rounded-[8px] bg-[#FFFFFF] border border-[#EAEAEA] hover:border-[#202223] hover:bg-[#F4F4F4] text-[#202223] text-[12px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            title="Refresh dashboard data"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#008060]' : 'text-[#616161]'} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. KEY STAT METRIC CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((k) => <SkeletonCard key={k} />)
        ) : (
          <>
            {/* 1. Appointments */}
            <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-4 sm:p-5 shadow-xs hover:border-[#CCCCCC] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
                  Appointments
                </span>
                <div className="w-8 h-8 rounded-[8px] bg-[#F4F4F4] border border-[#EAEAEA] flex items-center justify-center text-[#202223]">
                  <CalendarIcon size={15} />
                </div>
              </div>
              <div className="text-[26px] font-bold text-[#202223] font-mono tracking-tight leading-none mb-1">
                {stats.appointments_this_month ?? 0}
              </div>
              <div className="text-[11px] text-[#616161] flex items-center gap-1">
                <span>Total booked this month</span>
              </div>
            </div>

            {/* 2. Revenue */}
            <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-4 sm:p-5 shadow-xs hover:border-[#CCCCCC] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
                  Revenue Collected
                </span>
                <div className="w-8 h-8 rounded-[8px] bg-[#E3F1DF] border border-[#C3E6CD] flex items-center justify-center text-[#008060]">
                  <CreditCard size={15} />
                </div>
              </div>
              <div className="text-[26px] font-bold text-[#202223] font-mono tracking-tight leading-none mb-1">
                ₹{formatINR(stats.revenue_this_month ?? 0)}
              </div>
              <div className="text-[11px] text-[#008060] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#008060]" />
                <span>Paid consultations this month</span>
              </div>
            </div>

            {/* 3. Active Patients */}
            <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-4 sm:p-5 shadow-xs hover:border-[#CCCCCC] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
                  Active Patients
                </span>
                <div className="w-8 h-8 rounded-[8px] bg-[#F4F4F4] border border-[#EAEAEA] flex items-center justify-center text-[#202223]">
                  <Users size={15} />
                </div>
              </div>
              <div className="text-[26px] font-bold text-[#202223] font-mono tracking-tight leading-none mb-1">
                {stats.active_patients ?? 0}
              </div>
              <div className="text-[11px] text-[#616161] flex items-center gap-1">
                <span>Currently active care plans</span>
              </div>
            </div>

            {/* 4. New Patients */}
            <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-4 sm:p-5 shadow-xs hover:border-[#CCCCCC] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
                  New Registrations
                </span>
                <div className="w-8 h-8 rounded-[8px] bg-[#F4F4F4] border border-[#EAEAEA] flex items-center justify-center text-[#202223]">
                  <UserPlus size={15} />
                </div>
              </div>
              <div className="text-[26px] font-bold text-[#202223] font-mono tracking-tight leading-none mb-1">
                {stats.new_patients_this_month ?? 0}
              </div>
              <div className="text-[11px] text-[#616161] flex items-center gap-1">
                <span>New patients joined this month</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 3. TODAY'S CLINICAL PULSE ─────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
            Today's Clinical Pulse
          </span>
          <span className="text-[11px] text-[#8A8A8A]">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Scheduled */}
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#F4F4F4] border border-[#EAEAEA] flex items-center justify-center text-[#202223]">
                <CalendarCheck size={16} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#616161]">Scheduled Consultations</div>
                <div className="text-[16px] font-bold text-[#202223] font-mono">
                  {loading ? '—' : today.scheduled ?? 0} visits
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[6px] bg-[#F4F4F4] text-[#202223] border border-[#E5E5E5]">
              Today
            </span>
          </div>

          {/* Pending Payment */}
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#FFF9E6] border border-[#FFE8A3] flex items-center justify-center text-[#856404]">
                <Clock size={16} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#616161]">Awaiting Payment</div>
                <div className="text-[16px] font-bold text-[#856404] font-mono">
                  {loading ? '—' : today.pending_payment ?? 0} bookings
                </div>
              </div>
            </div>
            {(today.pending_payment ?? 0) > 0 ? (
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[6px] bg-[#FFF3CD] text-[#856404] border border-[#FFEEBA]">
                Action Needed
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[6px] bg-[#F4F4F4] text-[#8A8A8A] border border-[#EAEAEA]">
                Clear
              </span>
            )}
          </div>

          {/* Completed */}
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#E3F1DF] border border-[#C3E6CD] flex items-center justify-center text-[#008060]">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#616161]">Completed Sessions</div>
                <div className="text-[16px] font-bold text-[#008060] font-mono">
                  {loading ? '—' : today.completed ?? 0} done
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[6px] bg-[#E3F1DF] text-[#008060] border border-[#C3E6CD]">
              Success
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. RECENT AUDIT TRAIL (DOCTOR SIDE FILTERING & TABLE) ─────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold text-[#202223] tracking-tight">
              Clinical Audit Trail & Activity
            </h2>
            <p className="text-[11px] text-[#8A8A8A]">
              Comprehensive log of appointments, payments, and patient onboarding across AlignCare.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredActivities.length === 0}
              className="h-[32px] px-3 rounded-[8px] bg-[#FFFFFF] border border-[#EAEAEA] hover:border-[#202223] hover:bg-[#F4F4F4] disabled:opacity-40 disabled:cursor-not-allowed text-[#202223] text-[12px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              title="Export filtered records to CSV"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search + Filter Pills + Date Range */}
        <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] p-3 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
              <input
                type="text"
                placeholder="Search patient, doctor, invoice, or action..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-1.5 text-[12px] bg-[#FFFFFF] border border-[#EAEAEA] focus:border-[#202223] rounded-[8px] text-[#202223] placeholder:text-[#8A8A8A] outline-none transition-colors shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#202223] p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Right: Date Range Dropdown */}
            <div className="relative shrink-0" ref={dateDropdownRef}>
              <button
                type="button"
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="h-[34px] px-3 rounded-[8px] bg-[#FBFBFB] border border-[#EAEAEA] hover:border-[#202223] text-[#202223] text-[12px] font-medium transition-colors cursor-pointer inline-flex items-center gap-2 shadow-2xs"
              >
                <CalendarIcon size={14} className="text-[#616161]" />
                <span>
                  {dateRangeType === 'all' && 'All Time Dates'}
                  {dateRangeType === 'today' && 'Today Only'}
                  {dateRangeType === '7days' && 'Last 7 Days'}
                  {dateRangeType === '30days' && 'Last 30 Days'}
                  {dateRangeType === 'custom' && (appliedStartDate && appliedEndDate ? `${appliedStartDate} to ${appliedEndDate}` : 'Custom Range')}
                </span>
                <ChevronDown size={13} className="text-[#8A8A8A]" />
              </button>

              {isDateDropdownOpen && (
                <div className="absolute right-0 mt-1 w-[260px] bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] shadow-xl p-2 z-30 space-y-1 animate-fade-in text-[12px]">
                  {[
                    { id: 'all', label: 'All Dates' },
                    { id: 'today', label: 'Today Only' },
                    { id: '7days', label: 'Last 7 Days' },
                    { id: '30days', label: 'Last 30 Days' },
                    { id: 'custom', label: 'Custom Date Range' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setDateRangeType(item.id);
                        if (item.id !== 'custom') {
                          setIsDateDropdownOpen(false);
                          setCurrentPage(1);
                        }
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[6px] transition-colors cursor-pointer flex items-center justify-between ${
                        dateRangeType === item.id ? 'bg-[#202223] text-[#FFFFFF] font-medium' : 'text-[#202223] hover:bg-[#F4F4F4]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {dateRangeType === item.id && <span className="w-1.5 h-1.5 rounded-full bg-[#A3F56C]" />}
                    </button>
                  ))}

                  {dateRangeType === 'custom' && (
                    <div className="pt-2 border-t border-[#F0F0F0] space-y-2 px-1">
                      <div>
                        <label className="text-[10px] text-[#8A8A8A] uppercase font-semibold block mb-0.5">Start Date</label>
                        <input
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          className="w-full text-[11px] p-1.5 border border-[#EAEAEA] rounded-[6px] outline-none focus:border-[#202223]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8A8A8A] uppercase font-semibold block mb-0.5">End Date</label>
                        <input
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          className="w-full text-[11px] p-1.5 border border-[#EAEAEA] rounded-[6px] outline-none focus:border-[#202223]"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={!tempStartDate || !tempEndDate}
                        onClick={() => {
                          setAppliedStartDate(tempStartDate);
                          setAppliedEndDate(tempEndDate);
                          setIsDateDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className="w-full py-1.5 bg-[#000000] text-[#FFFFFF] rounded-[6px] text-[11px] font-semibold hover:bg-[#202020] disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        Apply Date Range
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Event Type Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#F0F0F0]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {[
                { id: 'all', label: 'All Activities', count: allActivities.length },
                { id: 'payment', label: 'Payments', count: paymentCount },
                { id: 'appointment', label: 'Appointments', count: apptCount },
                { id: 'new_patient', label: 'New Patients', count: ptCount },
              ].map((pill) => {
                const active = typeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      setTypeFilter(pill.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors shrink-0 cursor-pointer inline-flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#202223] text-[#FFFFFF] font-semibold shadow-xs'
                        : 'bg-[#FBFBFB] border border-[#EAEAEA] text-[#616161] hover:text-[#202223] hover:border-[#202223]'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      active ? 'bg-[#383838] text-[#FFFFFF]' : 'bg-[#EAEAEA] text-[#616161]'
                    }`}>
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Clear filters trigger if filtered */}
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-[#B81818] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <X size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* ── 5. SORTABLE AUDIT TRAIL TABLE ───────────────────────────── */}
        <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#EAEAEA] text-[#616161] text-[11px] font-semibold uppercase tracking-wider select-none">
                  
                  {/* Event Type Header */}
                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-[#202223] transition-colors"
                    onClick={() => handleSort('event_type')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Event Type</span>
                      {sortColumn === 'event_type' ? (
                        sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={11} className="text-[#A3A3A3]" />
                      )}
                    </div>
                  </th>

                  {/* Patient Name Header */}
                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-[#202223] transition-colors"
                    onClick={() => handleSort('patient_name')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Patient / Member</span>
                      {sortColumn === 'patient_name' ? (
                        sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={11} className="text-[#A3A3A3]" />
                      )}
                    </div>
                  </th>

                  {/* Activity Detail Header */}
                  <th className="py-3 px-4">
                    Activity Context
                  </th>

                  {/* Amount / Status Header */}
                  <th 
                    className="py-3 px-4 cursor-pointer hover:text-[#202223] transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Amount / Status</span>
                      {sortColumn === 'amount' ? (
                        sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={11} className="text-[#A3A3A3]" />
                      )}
                    </div>
                  </th>

                  {/* Timestamp Header */}
                  <th 
                    className="py-3 px-4 text-right cursor-pointer hover:text-[#202223] transition-colors"
                    onClick={() => handleSort('event_time')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Timestamp</span>
                      {sortColumn === 'event_time' ? (
                        sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={11} className="text-[#A3A3A3]" />
                      )}
                    </div>
                  </th>

                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0] text-[13px] text-[#202223]">
                {loading ? (
                  [1, 2, 3, 4, 5].map((k) => (
                    <tr key={k} className="border-b border-[#F0F0F0] animate-pulse">
                      <td className="py-3.5 px-4"><div className="h-4 w-20 bg-[#F0F0F0] rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-32 bg-[#F0F0F0] rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-48 bg-[#F0F0F0] rounded" /></td>
                      <td className="py-3.5 px-4"><div className="h-4 w-16 bg-[#F0F0F0] rounded" /></td>
                      <td className="py-3.5 px-4 text-right"><div className="h-4 w-14 bg-[#F0F0F0] rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : paginatedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-4 text-center">
                      <AlertCircle size={30} className="mx-auto text-[#CCCCCC] mb-2" />
                      <div className="text-[13px] font-semibold text-[#202223]">No matching audit events</div>
                      <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                        Try clearing or modifying your search or date range filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedActivities.map((ev, i) => {
                    const isPayment = ev.event_type === 'payment_received';
                    const isAppt = ev.event_type === 'appointment_booked';
                    const isNewPt = ev.event_type === 'new_patient';

                    return (
                      <tr key={i} className="hover:bg-[#FAFAFA] transition-colors">
                        
                        {/* Event Type Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-medium border ${
                            isPayment 
                              ? 'bg-[#E3F1DF] text-[#008060] border-[#C3E6CD]' 
                              : isAppt 
                              ? 'bg-[#F4F4F4] text-[#202223] border-[#E0E0E0]' 
                              : 'bg-[#F8F9FA] text-[#616161] border-[#EAEAEA]'
                          }`}>
                            {isPayment ? <Receipt size={12} /> : isAppt ? <CalendarIcon size={12} /> : <UserPlus size={12} />}
                            <span>{isPayment ? 'Payment' : isAppt ? 'Appointment' : 'New Patient'}</span>
                          </span>
                        </td>

                        {/* Patient Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#202223]">
                            {ev.patient_name || 'System User'}
                          </div>
                        </td>

                        {/* Activity Context */}
                        <td className="py-3.5 px-4 text-[12px] text-[#616161]">
                          {isAppt && (
                            <span>Booked consultation with <strong className="text-[#202223]">{ev.doctor_name || 'Doctor'}</strong> for <span className="font-mono text-[#202223]">{ev.detail}</span></span>
                          )}
                          {isPayment && (
                            <span>Settled payment receipt for invoice <strong className="font-mono text-[#202223]">{ev.detail}</strong></span>
                          )}
                          {isNewPt && (
                            <span>Registered new patient profile account <span className="text-[#8A8A8A]">{ev.detail || ''}</span></span>
                          )}
                        </td>

                        {/* Amount / Status Badge */}
                        <td className="py-3.5 px-4">
                          {isPayment ? (
                            <span className="font-mono font-bold text-[12px] text-[#008060] bg-[#E3F1DF] px-2 py-0.5 rounded-[6px] border border-[#C3E6CD]">
                              ₹{formatINR(ev.amount)}
                            </span>
                          ) : isAppt ? (
                            <span className="text-[11px] font-medium text-[#202223] bg-[#F4F4F4] px-2 py-0.5 rounded-[6px] border border-[#E0E0E0]">
                              Confirmed
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-[#616161] bg-[#F8F9FA] px-2 py-0.5 rounded-[6px] border border-[#EAEAEA]">
                              Enrolled
                            </span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="text-[11px] font-mono text-[#202223]">
                            {timeAgo(ev.event_time)}
                          </div>
                          <div className="text-[10px] text-[#8A8A8A] font-mono">
                            {new Date(ev.event_time).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && filteredActivities.length > 0 && (
            <div className="px-4 py-3 bg-[#FAFAFA] border-t border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#616161]">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] px-2 py-1 text-[12px] text-[#202223] outline-none cursor-pointer focus:border-[#202223]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-[#8A8A8A]">
                  Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-[6px] border border-[#EAEAEA] bg-[#FFFFFF] hover:bg-[#F4F4F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-[#202223]"
                  title="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 py-0.5 font-medium text-[#202223]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-[6px] border border-[#EAEAEA] bg-[#FFFFFF] hover:bg-[#F4F4F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-[#202223]"
                  title="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
