import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Stethoscope, 
  CheckCircle2, 
  X, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import BookAppointmentModal from '../components/BookAppointmentModal';

const AppointmentsPage = () => {
  const { getToken } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  
  // Status filter state
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'upcoming', 'pending_payment', 'completed', 'cancelled'
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const mobileFilterRef = useRef(null);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Past consultations date range filter
  const [datePreset, setDatePreset] = useState('all'); // 'all', '7d', '30d', '90d', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [expandedAppointmentId, setExpandedAppointmentId] = useState(null);

  // Pagination for past appointments
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Close mobile filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileFilterRef.current && !mobileFilterRef.current.contains(e.target)) {
        setIsMobileFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch appointments');
      
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel appointment');
      
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
      setCancelConfirmId(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Razorpay resume payment
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayNow = async (appointment) => {
    try {
      const token = await getToken();

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${appointment.id}/resume-payment`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 410) {
          alert(data.message || 'Payment window expired. Please book a new slot.');
          fetchAppointments();
        } else {
          alert(data.message || 'Could not resume payment. Please try again.');
        }
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Payment gateway failed to load.');
        return;
      }

      const options = {
        key: data.razorpay_key_id,
        amount: data.razorpay_order.amount,
        currency: data.razorpay_order.currency,
        order_id: data.razorpay_order.id,
        name: 'AlignCare',
        description: 'Consultation Booking',
        theme: { color: '#008060' },
        handler: async function (response) {
          try {
            const t = await getToken();
            await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${appointment.id}/verify-payment`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
                body: JSON.stringify(response)
              }
            );
            fetchAppointments();
          } catch (err) {
            console.error('Verification failed:', err);
            alert('Payment received but verification failed.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
    }
  };

  // Date partition
  const today = new Date().toLocaleDateString('en-CA');
  
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(a => a.appointment_date >= today && !['cancelled', 'no_show', 'completed'].includes(a.status))
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  }, [appointments, today]);

  const pastAppointments = useMemo(() => {
    return appointments
      .filter(a => a.appointment_date < today || ['cancelled', 'no_show', 'completed'].includes(a.status))
      .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
  }, [appointments, today]);

  // Counts
  const totalCount = appointments.length;
  const upcomingCount = upcomingAppointments.length;
  const pendingPaymentCount = appointments.filter(a => a.status === 'pending_payment').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => ['cancelled', 'no_show'].includes(a.status)).length;

  const filterOptions = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'upcoming', label: 'Upcoming', count: upcomingCount },
    { id: 'pending_payment', label: 'Pending Payment', count: pendingPaymentCount },
    { id: 'completed', label: 'Completed', count: completedCount },
    { id: 'cancelled', label: 'Cancelled', count: cancelledCount },
  ];

  const currentFilterObj = filterOptions.find(f => f.id === activeFilter) || filterOptions[0];

  // Filtered upcoming appointments
  const filteredUpcoming = useMemo(() => {
    return upcomingAppointments.filter(appt => {
      if (activeFilter === 'pending_payment' && appt.status !== 'pending_payment') return false;
      if (activeFilter === 'completed' || activeFilter === 'cancelled') return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const doc = (appt.doctor_name || '').toLowerCase();
        const reason = (appt.visit_reason || '').toLowerCase();
        return doc.includes(q) || reason.includes(q);
      }
      return true;
    });
  }, [upcomingAppointments, activeFilter, searchQuery]);

  // Filtered past appointments
  const filteredPast = useMemo(() => {
    return pastAppointments.filter(appt => {
      if (activeFilter === 'pending_payment' && appt.status !== 'pending_payment') return false;
      if (activeFilter === 'completed' && appt.status !== 'completed') return false;
      if (activeFilter === 'cancelled' && !['cancelled', 'no_show'].includes(appt.status)) return false;
      if (activeFilter === 'upcoming') return false;

      // Date range filter
      if (datePreset === '7d') {
        const threshold = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        if (appt.appointment_date < threshold) return false;
      } else if (datePreset === '30d') {
        const threshold = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        if (appt.appointment_date < threshold) return false;
      } else if (datePreset === '90d') {
        const threshold = format(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        if (appt.appointment_date < threshold) return false;
      } else if (datePreset === 'custom') {
        if (customStartDate && appt.appointment_date < customStartDate) return false;
        if (customEndDate && appt.appointment_date > customEndDate) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const doc = (appt.doctor_name || '').toLowerCase();
        const reason = (appt.visit_reason || '').toLowerCase();
        const notes = (appt.notes || '').toLowerCase();
        return doc.includes(q) || reason.includes(q) || notes.includes(q);
      }
      return true;
    });
  }, [pastAppointments, activeFilter, datePreset, customStartDate, customEndDate, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPast.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const paginatedPast = filteredPast.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="w-full max-w-full space-y-4 animate-fade-in font-['Inter',system-ui,sans-serif] pb-10">
      
      {/* ── 1. CLEAN PAGE HEADER ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#EAEAEA]">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202223]">
          Appointments
        </h1>

        <button 
          onClick={() => setShowBookingModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#202020] active:scale-[0.99] rounded-[8px] transition-all cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* ── 2. METRIC SUMMARY BAR (Compact & Clean) ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <div 
          onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}
          className={`p-2.5 sm:p-3 bg-[#FFFFFF] border rounded-[8px] cursor-pointer transition-all ${
            activeFilter === 'all' ? 'border-[#202223] ring-1 ring-[#202223]' : 'border-[#EAEAEA] hover:border-[#D0D0D0]'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-medium text-[#616161] uppercase tracking-wider block">Total Bookings</span>
          <div className="text-lg sm:text-xl font-bold text-[#202223] font-mono mt-0.5">{totalCount}</div>
        </div>

        <div 
          onClick={() => { setActiveFilter('upcoming'); setCurrentPage(1); }}
          className={`p-2.5 sm:p-3 bg-[#FFFFFF] border rounded-[8px] cursor-pointer transition-all ${
            activeFilter === 'upcoming' ? 'border-[#008060] ring-1 ring-[#008060]' : 'border-[#EAEAEA] hover:border-[#D0D0D0]'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-medium text-[#616161] uppercase tracking-wider block">Upcoming Visits</span>
          <div className="text-lg sm:text-xl font-bold text-[#008060] font-mono mt-0.5">{upcomingCount}</div>
        </div>

        <div 
          onClick={() => { setActiveFilter('pending_payment'); setCurrentPage(1); }}
          className={`p-2.5 sm:p-3 bg-[#FFFFFF] border rounded-[8px] cursor-pointer transition-all ${
            activeFilter === 'pending_payment' ? 'border-[#B98900] ring-1 ring-[#B98900]' : 'border-[#EAEAEA] hover:border-[#D0D0D0]'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-medium text-[#616161] uppercase tracking-wider block">Pending Payment</span>
          <div className="text-lg sm:text-xl font-bold text-[#B98900] font-mono mt-0.5">{pendingPaymentCount}</div>
        </div>

        <div 
          onClick={() => { setActiveFilter('completed'); setCurrentPage(1); }}
          className={`p-2.5 sm:p-3 bg-[#FFFFFF] border rounded-[8px] cursor-pointer transition-all ${
            activeFilter === 'completed' ? 'border-[#202223] ring-1 ring-[#202223]' : 'border-[#EAEAEA] hover:border-[#D0D0D0]'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-medium text-[#616161] uppercase tracking-wider block">Completed</span>
          <div className="text-lg sm:text-xl font-bold text-[#202223] font-mono mt-0.5">{completedCount}</div>
        </div>
      </div>

      {/* ── 3. FILTER TABS & SEARCH BAR ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        
        {/* Mobile Filter Dropdown (< sm: 640px) */}
        <div className="block sm:hidden w-full relative" ref={mobileFilterRef}>
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[8px] text-[12px] font-medium text-[#202223] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-[#616161]" />
              <span className="font-semibold text-[#202223]">{currentFilterObj.label}</span>
              <span className="text-[11px] px-1.5 py-0.2 bg-[#F0F0F0] text-[#616161] rounded-full font-mono">
                {currentFilterObj.count}
              </span>
            </div>
            <ChevronDown size={14} className={`text-[#8A8A8A] transition-transform duration-200 ${isMobileFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMobileFilterOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[8px] shadow-lg p-1 z-30 animate-fade-in text-[12px]">
              {filterOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setActiveFilter(opt.id);
                    setCurrentPage(1);
                    setIsMobileFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-left transition-colors cursor-pointer ${
                    activeFilter === opt.id 
                      ? 'bg-[#F4F4F4] font-semibold text-[#202223]' 
                      : 'text-[#616161] hover:bg-[#FAFAFA]'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono font-medium bg-[#EFEFEF] text-[#616161]">
                    {opt.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tablet & Desktop Horizontal Pills (>= sm: 640px) */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-[12px]">
          {filterOptions.map(f => (
            <button
              key={f.id}
              onClick={() => { setActiveFilter(f.id); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeFilter === f.id
                  ? 'bg-[#202223] text-[#FFFFFF]'
                  : 'bg-[#F4F4F4] text-[#616161] hover:bg-[#EAEAEA]'
              }`}
            >
              <span>{f.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeFilter === f.id ? 'bg-[#3A3A3A] text-[#FFFFFF]' : 'bg-[#EAEAEA] text-[#616161]'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-[240px] shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search doctor or reason..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-8 pr-7 py-2 sm:py-1.5 text-[12px] bg-[#FFFFFF] border border-[#EAEAEA] rounded-[8px] text-[#202223] placeholder-[#8A8A8A] outline-none focus:border-[#202223] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#202223] p-0.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── 4. UPCOMING APPOINTMENTS SECTION ────────────────────────────────── */}
      {activeFilter !== 'completed' && activeFilter !== 'cancelled' && (
        <section className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-semibold text-[#202223] uppercase tracking-wide">
              Upcoming Appointments
            </h2>
            <span className="text-[11px] sm:text-[12px] text-[#616161] font-mono">
              {filteredUpcoming.length} {filteredUpcoming.length === 1 ? 'visit' : 'visits'}
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center bg-[#FFFFFF] border border-[#EAEAEA] rounded-[10px]">
              <div className="w-5 h-5 border-2 border-[#202223] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-[12px] text-[#616161]">Loading appointments...</span>
            </div>
          ) : filteredUpcoming.length === 0 ? (
            <div className="p-6 text-center bg-[#FBFBFB] border border-dashed border-[#EAEAEA] rounded-[10px]">
              <Calendar size={24} className="text-[#8A8A8A] mx-auto mb-1.5 opacity-60" />
              <p className="text-[13px] font-medium text-[#202223]">No upcoming appointments</p>
              <button
                onClick={() => setShowBookingModal(true)}
                className="mt-2 text-[12px] font-medium text-[#008060] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                Book a consultation <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUpcoming.map((appt) => {
                const apptDate = new Date(appt.appointment_date);
                const isPendingPayment = appt.status === 'pending_payment';
                let remaining = 0;
                if (isPendingPayment && appt.payment_expires_at) {
                  remaining = Math.max(0, Math.floor((new Date(appt.payment_expires_at) - new Date()) / 1000));
                }

                return (
                  <div 
                    key={appt.id} 
                    className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] p-3.5 sm:p-4 shadow-xs hover:border-[#D0D0D0] transition-colors flex flex-col justify-between gap-3 overflow-hidden"
                  >
                    {/* Top Header: Date/Time on Left, Status Badge on Right */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#F0F0F0] gap-2">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#202223] truncate">
                        <Calendar size={13} className="text-[#616161] shrink-0" />
                        <span className="truncate">{format(apptDate, 'EEE, MMM d, yyyy')}</span>
                        <span className="text-[#D0D0D0]">·</span>
                        <span className="text-[#616161] font-mono text-[11px] shrink-0">
                          {appt.start_time.substring(0, 5)}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {appt.status === 'scheduled' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#D9F7C3] text-[#245B19] border border-[#b2e89b]">
                            <CheckCircle2 size={11} /> Confirmed
                          </span>
                        ) : isPendingPayment ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF2CC] text-[#8A6116] border border-[#FFE58F]">
                            <Clock size={11} /> Pending Payment
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F4F4] text-[#616161] capitalize border border-[#EAEAEA]">
                            {appt.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body: Doctor & Reason */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#F4F4F4] border border-[#EAEAEA] flex items-center justify-center shrink-0 text-[#202223] font-semibold text-[11px]">
                          {appt.doctor_name ? appt.doctor_name.slice(0, 2).toUpperCase() : 'DR'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-semibold text-[#202223] truncate">
                            Dr. {appt.doctor_name || 'Assigned Specialist'}
                          </h4>
                          <span className="text-[11px] text-[#616161] truncate block">
                            Physiotherapy & Rehabilitation
                          </span>
                        </div>
                      </div>

                      {appt.visit_reason && (
                        <div className="text-[11px] text-[#555555] bg-[#F9F9F9] px-2.5 py-1.5 rounded-[6px] border border-[#EEEEEE]">
                          <span className="text-[#8A8A8A] font-medium">Reason: </span>
                          <span className="text-[#202223]">{appt.visit_reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-[#F0F0F0] gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#8A8A8A]">
                          Fee: <strong className="text-[#202223] text-[12px]">₹800</strong>
                        </span>
                        {isPendingPayment && remaining > 0 && (
                          <span className="text-[10px] text-[#B98900] bg-[#FFF8E6] px-1.5 py-0.5 rounded font-mono">
                            {Math.floor(remaining / 60)}m left
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPendingPayment && remaining > 0 ? (
                          <button 
                            onClick={() => handlePayNow(appt)}
                            className="px-3 py-1.5 rounded-[6px] bg-[#008060] hover:bg-[#006e52] text-[#FFFFFF] text-[12px] font-medium transition-colors cursor-pointer"
                          >
                            Pay Now (₹800)
                          </button>
                        ) : isPendingPayment && remaining === 0 ? (
                          <span className="text-[11px] font-medium text-[#B81818]">Slot Expired</span>
                        ) : appt.status === 'scheduled' ? (
                          <button 
                            onClick={() => {
                              const apptDateTime = new Date(`${appt.appointment_date}T${appt.start_time}`);
                              const diffInMinutes = (apptDateTime - new Date()) / (1000 * 60);
                              if (diffInMinutes <= 60) {
                                alert("You cannot cancel an appointment within 60 minutes of the scheduled time.");
                              } else {
                                setCancelConfirmId(appt.id);
                              }
                            }}
                            className="px-2 py-1 rounded-[6px] text-[#8A8A8A] hover:text-[#B81818] hover:bg-[#FCE4E4] text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── 5. PAST CONSULTATION HISTORY ────────────────────────────────────── */}
      {activeFilter !== 'upcoming' && (
        <section className="space-y-2.5 pt-3 border-t border-[#EAEAEA]">
          
          {/* Header + Date Filter SIDE BY SIDE */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 shrink-0">
              <h2 className="text-xs sm:text-sm font-semibold text-[#202223] uppercase tracking-wide">
                Past Consultations
              </h2>
              <span className="text-[11px] text-[#616161] font-mono bg-[#F4F4F4] px-1.5 py-0.2 rounded-full border border-[#EAEAEA]">
                {filteredPast.length}
              </span>
            </div>

            {/* Side-by-side Date Filter Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-[12px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-[6px] text-[#202223] font-medium outline-none cursor-pointer hover:border-[#D0D0D0] transition-colors"
              >
                <option value="all">All Dates</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="custom">Custom Range...</option>
              </select>

              {datePreset !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setDatePreset('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setCurrentPage(1);
                  }}
                  title="Reset date filter"
                  className="p-1 rounded-[6px] text-[#8A8A8A] hover:text-[#202223] hover:bg-[#F0F0F0] cursor-pointer"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Custom Date Range Inputs (Only when Custom is selected) */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 p-2 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[6px] text-[11px] flex-wrap">
              <span className="text-[#616161]">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                className="bg-[#FFFFFF] border border-[#E0E0E0] rounded-[4px] px-1.5 py-0.5 text-[#202223] outline-none"
              />
              <span className="text-[#616161]">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                className="bg-[#FFFFFF] border border-[#E0E0E0] rounded-[4px] px-1.5 py-0.5 text-[#202223] outline-none"
              />
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                  className="text-[#D72C0D] hover:underline cursor-pointer font-medium ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Past Consultation Cards Grid */}
          {filteredPast.length === 0 ? (
            <div className="p-6 text-center bg-[#FBFBFB] border border-dashed border-[#EAEAEA] rounded-[8px] text-[12px] text-[#616161]">
              No past consultations found.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paginatedPast.map((appt) => {
                  const apptDate = new Date(appt.appointment_date);
                  const isExpanded = expandedAppointmentId === appt.id;

                  return (
                    <div 
                      key={appt.id} 
                      className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] p-3.5 sm:p-4 shadow-xs hover:border-[#D0D0D0] transition-colors flex flex-col justify-between gap-3 overflow-hidden"
                    >
                      {/* Top Header: Date/Time on Left, Status Badge on Right */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#F0F0F0] gap-2">
                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#202223] truncate">
                          <Calendar size={13} className="text-[#616161] shrink-0" />
                          <span className="truncate">{format(apptDate, 'EEE, MMM d, yyyy')}</span>
                          <span className="text-[#D0D0D0]">·</span>
                          <span className="text-[#616161] font-mono text-[11px] shrink-0">
                            {appt.start_time.substring(0, 5)}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {appt.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#D9F7C3] text-[#245B19] border border-[#B2E89B]">
                              <CheckCircle2 size={11} /> Completed
                            </span>
                          )}
                          {appt.status === 'no_show' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF2CC] text-[#8A6116] border border-[#FFE58F]">
                              No Show
                            </span>
                          )}
                          {appt.status === 'cancelled' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FCE4E4] text-[#B81818] border border-[#F5C2C2]">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Body: Doctor & Reason */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#F4F4F4] border border-[#EAEAEA] flex items-center justify-center shrink-0 text-[#202223] font-semibold text-[11px]">
                              {appt.doctor_name ? appt.doctor_name.slice(0, 2).toUpperCase() : 'DR'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[13px] font-semibold text-[#202223] truncate">
                                Dr. {appt.doctor_name || 'Assigned Specialist'}
                              </h4>
                              <span className="text-[11px] text-[#616161] truncate block">
                                {appt.visit_reason || 'Follow-up Consultation'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-[#8A8A8A] uppercase font-semibold block leading-tight">Fee</span>
                            <span className="text-[12px] font-semibold text-[#202223]">₹800</span>
                          </div>
                        </div>

                        {/* Doctor Notes Toggle */}
                        {appt.notes && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setExpandedAppointmentId(isExpanded ? null : appt.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#616161] hover:text-[#202223] transition-colors cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide Doctor Notes' : 'View Doctor Notes'}</span>
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>

                            {isExpanded && (
                              <div className="mt-1.5 p-2 bg-[#FAFAFA] border border-[#EEEEEE] rounded-[6px] text-[11px] text-[#404040] leading-relaxed animate-fade-in">
                                {appt.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer: Follow-up Booking Action */}
                      <div className="pt-2.5 border-t border-[#F0F0F0] flex items-center justify-between text-[11px]">
                        <span className="text-[#8A8A8A]">Finished consultation</span>
                        <button
                          type="button"
                          onClick={() => setShowBookingModal(true)}
                          className="text-[#008060] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          Book Follow-up <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── 6. PROPER PAGINATION ── */}
              <div className="px-3.5 py-3 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[10px] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[12px] text-[#616161]">
                {/* Left: Rows Per Page & Record Count */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                  <div className="flex items-center gap-1.5">
                    <span>Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="px-2 py-0.8 bg-[#FFFFFF] border border-[#E5E5E5] rounded-md text-[#202223] text-[12px] font-medium outline-none cursor-pointer hover:border-[#D0D0D0]"
                    >
                      <option value="4">4 per page</option>
                      <option value="6">6 per page</option>
                      <option value="10">10 per page</option>
                    </select>
                  </div>

                  <span className="text-[#8A8A8A]">
                    Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredPast.length)} of {filteredPast.length}
                  </span>
                </div>

                {/* Right: Previous / Page Indicator / Next */}
                <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#202223] text-[12px] font-medium hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  
                  <span className="px-2 font-mono text-[12px] text-[#202223]">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] text-[#202223] text-[12px] font-medium hover:bg-[#F0F0F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 7. CANCEL CONFIRMATION MODAL ────────────────────────────────────── */}
      {cancelConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FFFFFF] rounded-[14px] max-w-sm w-full p-5 border border-[#EAEAEA] shadow-2xl text-center">
            <div className="w-10 h-10 rounded-full bg-[#FCE4E4] text-[#B81818] flex items-center justify-center mx-auto mb-2.5">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-base font-semibold text-[#202223]">
              Cancel appointment?
            </h3>
            <p className="text-[12px] text-[#616161] mt-1 mb-4">
              The reserved clinical slot will be released. This action cannot be undone.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCancelConfirmId(null)}
                className="flex-1 py-1.5 px-3 text-[12px] font-medium text-[#202223] bg-[#F4F4F4] hover:bg-[#EAEAEA] rounded-[6px] transition-colors cursor-pointer"
              >
                Keep
              </button>
              <button
                onClick={() => cancelAppointment(cancelConfirmId)}
                className="flex-1 py-1.5 px-3 text-[12px] font-semibold text-[#FFFFFF] bg-[#B81818] hover:bg-[#9B1414] rounded-[6px] transition-colors cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. BOOKING MODAL ────────────────────────────────────────────────── */}
      <BookAppointmentModal 
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={() => {
          fetchAppointments();
          setShowBookingModal(false);
        }}
      />

    </div>
  );
};

export default AppointmentsPage;
