import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  Calendar, 
  DollarSign, 
  UserPlus, 
  CalendarPlus, 
  FileText, 
  Loader2, 
  Search, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  User, 
  Stethoscope, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import BookAppointmentModal from '../components/BookAppointmentModal';
import RegisterPatientModal from '../components/RegisterPatientModal';
import CollectPaymentModal from '../components/CollectPaymentModal';
import ViewAppointmentModal from '../components/ViewAppointmentModal';
import CancelConfirmationModal from '../components/CancelConfirmationModal';

const ReceptionistDashboard = () => {
  const { getToken } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tab State: 'appointmentsView' | 'pendingView'
  const [activeTab, setActiveTab] = useState('appointmentsView');

  // Real-time timer for active holds countdown
  const [nowTime, setNowTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [paymentAppointment, setPaymentAppointment] = useState(null);
  const [viewAppointment, setViewAppointment] = useState(null);
  const [cancelAppointmentObj, setCancelAppointmentObj] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [getToken]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const activeAppts = data.appointments.filter(a => !['cancelled', 'no_show', 'completed'].includes(a.status));
        setAppointments(activeAppts);
      } else {
        setError(data.message || 'Failed to fetch appointments.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingComplete = () => {
    fetchAppointments();
  };

  const handlePatientRegistered = () => {
    setIsRegisterModalOpen(false);
    setIsBookModalOpen(true);
  };

  const handlePaymentComplete = () => {
    fetchAppointments();
  };

  const handleCancelled = () => {
    fetchAppointments();
  };

  const handleCancelDirectly = (appt) => {
    setCancelAppointmentObj(appt);
  };

  const confirmCancel = async (apptId) => {
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/appointments/${apptId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCancelAppointmentObj(null);
        fetchAppointments();
      } else {
        alert(data.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Error cancelling:', err);
      alert('A network error occurred while cancelling.');
    }
  };

  // Categorize Appointments
  const heldBookings = appointments.filter(a => {
    if (a.payment_status !== 'pending' && a.status !== 'pending_payment') return false;
    if (!a.payment_expires_at) return false;
    return new Date(a.payment_expires_at).getTime() > nowTime;
  });

  const todayDateString = new Date().toLocaleDateString('en-CA');
  const mainListAppointments = appointments.filter(a => 
    !heldBookings.includes(a) && a.appointment_date === todayDateString
  );

  // Summary Metrics
  const appointmentsToday = mainListAppointments.length;
  const pendingPayment = heldBookings.length;
  const newToday = appointments.filter(a => a.created_at && a.created_at.startsWith(todayDateString)).length;

  // Filter based on active tab & search query
  const rawList = activeTab === 'appointmentsView' ? mainListAppointments : heldBookings;
  const filteredList = rawList.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const patientName = (a.patient_name || '').toLowerCase();
    const doctorName = (a.doctor_name || '').toLowerCase();
    const reason = (a.visit_reason || a.reason || '').toLowerCase();
    return patientName.includes(q) || doctorName.includes(q) || reason.includes(q);
  });

  // Pagination logic
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;

  // Formatting helpers
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCountdown = (expiresAtStr) => {
    const diff = new Date(expiresAtStr).getTime() - nowTime;
    if (diff <= 0) return 'Expired';
    const totalSeconds = Math.floor(diff / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Modals */}
      <BookAppointmentModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
        onBooked={handleBookingComplete} 
        onRequestRegister={() => {
          setIsBookModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      
      <RegisterPatientModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onRegistered={handlePatientRegistered} 
      />

      <CollectPaymentModal
        isOpen={!!paymentAppointment}
        onClose={() => setPaymentAppointment(null)}
        appointment={paymentAppointment}
        onPaymentComplete={handlePaymentComplete}
      />

      <ViewAppointmentModal
        isOpen={!!viewAppointment}
        onClose={() => setViewAppointment(null)}
        appointment={viewAppointment}
        onCancelled={handleCancelled}
      />

      <CancelConfirmationModal
        isOpen={!!cancelAppointmentObj}
        onClose={() => setCancelAppointmentObj(null)}
        onConfirm={confirmCancel}
        appointment={cancelAppointmentObj}
      />

      {/* ── 1. TOP HEADER & DESK ACTIONS ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6D7175] bg-[#F4F4F4] px-2.5 py-0.5 rounded-full">
              <Calendar className="w-3 h-3 text-[#8A8A8A]" />
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202223]">
            Front Desk Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#6D7175] mt-0.5">
            Manage today's clinical schedules, pending payment holds, and walk-in bookings.
          </p>
        </div>

        {/* Quick Action CTA Buttons (Matching Doctor & Patient suites with near-black primary) */}
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => setIsBookModalOpen(true)}
            className="btn-primary-saas flex items-center gap-1.5 text-[12px] sm:text-[13px] py-2 px-3.5"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn-secondary-saas flex items-center gap-1.5 text-[12px] sm:text-[13px] py-2 px-3.5"
          >
            <UserPlus className="w-4 h-4 text-[#6D7175]" />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

      {/* ── 2. METRIC SUMMARY CARDS (With Colored Underlines) ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Metric 1: Appointments Today */}
        <div 
          onClick={() => setActiveTab('appointmentsView')}
          className={`relative bg-[#FFFFFF] rounded-xl border p-4 sm:p-5 transition-all cursor-pointer ${
            activeTab === 'appointmentsView'
              ? 'border-[#202223] shadow-md ring-1 ring-[#202223]/20'
              : 'border-[#EAEAEA] hover:border-[#D1D1D1] hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-[#6D7175]">Appointments Today</span>
            <div className="w-8 h-8 rounded-lg bg-[#4088F8]/10 flex items-center justify-center text-[#4088F8]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202223]">
              {appointmentsToday}
            </span>
            <span className="text-[11px] text-[#6D7175]">scheduled visits</span>
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#4088F8] rounded-full" />
        </div>

        {/* Metric 2: Pending Payment Holds */}
        <div 
          onClick={() => setActiveTab('pendingView')}
          className={`relative bg-[#FFFFFF] rounded-xl border p-4 sm:p-5 transition-all cursor-pointer ${
            activeTab === 'pendingView'
              ? 'border-[#B25E09] shadow-md ring-1 ring-[#B25E09]/20'
              : 'border-[#EAEAEA] hover:border-[#D1D1D1] hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-[#6D7175]">Pending Payment Holds</span>
            <div className="w-8 h-8 rounded-lg bg-[#F5C451]/15 flex items-center justify-center text-[#B25E09]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${pendingPayment > 0 ? 'text-[#B25E09]' : 'text-[#202223]'}`}>
              {pendingPayment}
            </span>
            <span className="text-[11px] text-[#6D7175]">held bookings</span>
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#F5C451] rounded-full" />
        </div>

        {/* Metric 3: New Bookings */}
        <div className="relative bg-[#FFFFFF] rounded-xl border border-[#EAEAEA] p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-[#6D7175]">New Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-[#F4F4F4] flex items-center justify-center text-[#202223]">
              <CalendarPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202223]">
              {newToday}
            </span>
            <span className="text-[11px] text-[#6D7175]">created today</span>
          </div>
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#202223] rounded-full" />
        </div>

      </div>

      {/* ── 3. TOOLBAR (TABS + SEARCH + REFRESH) ────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#EAEAEA] p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Left: View Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F4F4F4] rounded-lg w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('appointmentsView')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs sm:text-[13px] font-medium transition-all cursor-pointer ${
              activeTab === 'appointmentsView'
                ? 'bg-[#FFFFFF] text-[#202223] shadow-sm font-semibold'
                : 'text-[#6D7175] hover:text-[#202223]'
            }`}
          >
            Today's Visits ({appointmentsToday})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pendingView')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs sm:text-[13px] font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pendingView'
                ? 'bg-[#FFFFFF] text-[#202223] shadow-sm font-semibold'
                : 'text-[#6D7175] hover:text-[#202223]'
            }`}
          >
            <span>Held Bookings</span>
            {pendingPayment > 0 && (
              <span className="bg-[#FEF3D6] text-[#B25E09] px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingPayment}
              </span>
            )}
          </button>
        </div>

        {/* Right: Search Box + Refresh */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-[260px]">
            <Search className="w-3.5 h-3.5 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search patient or doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-[#FFFFFF] border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all text-[#202223] placeholder-[#8A8A8A]"
            />
          </div>

          <button
            type="button"
            onClick={fetchAppointments}
            disabled={loading}
            className="p-2 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] text-[#6D7175] hover:text-[#202223] hover:bg-[#F9FAFB] transition-colors cursor-pointer shrink-0"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#202223]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 4. APPOINTMENT CARDS / TABLE ────────────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#EAEAEA] shadow-sm overflow-hidden">
        
        {/* Section Header */}
        <div className="px-4 py-3 border-b border-[#EAEAEA] bg-[#F9FAFB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-semibold text-[#202223]">
              {activeTab === 'appointmentsView' ? "Today's Scheduled Appointments" : "Held Bookings — Awaiting Payment"}
            </h2>
            <span className="text-[11px] text-[#6D7175] bg-[#EAEAEA] px-2 py-0.5 rounded-full font-medium">
              {filteredList.length} total
            </span>
          </div>

          {activeTab === 'pendingView' && (
            <span className="text-[11px] text-[#B25E09] font-medium hidden sm:inline flex items-center gap-1">
              <Clock className="w-3 h-3" /> Real-time 15-min countdowns
            </span>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 text-[#202223] animate-spin" />
            <span className="text-xs text-[#8A8A8A]">Loading appointments...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-[#B42318] bg-[#FEF3F2]">
            {error}
          </div>
        ) : currentAppointments.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F4F4F4] flex items-center justify-center text-[#8A8A8A] mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#202223] mb-1">
              {searchQuery ? 'No appointments match your search' : 'No appointments scheduled'}
            </h3>
            <p className="text-xs text-[#6D7175] max-w-sm mx-auto">
              {activeTab === 'pendingView' 
                ? 'All booked appointments have settled payment or expired.'
                : 'There are no active patient consultations scheduled for today.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAEAEA]">
            {currentAppointments.map((appt) => {
              const isBlocked = appt.status === 'blocked';
              const isPending = appt.payment_status === 'pending' || appt.status === 'pending_payment';
              const isInProgress = appt.status === 'in_progress';
              const patientInitials = (appt.patient_name || 'PT')
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div 
                  key={appt.id} 
                  className={`p-3.5 sm:p-4 hover:bg-[#F9FAFB] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 ${
                    isBlocked ? 'opacity-60 bg-[#FAFAFA]' : ''
                  }`}
                >
                  
                  {/* Left Column: Time & Patient Information */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    
                    {/* Time Pill */}
                    <div className="shrink-0 flex flex-col items-center justify-center w-[72px] sm:w-[84px] py-1.5 px-2 rounded-lg bg-[#F4F4F4] border border-[#EAEAEA] text-center">
                      <span className="text-[12px] sm:text-[13px] font-bold text-[#202223] leading-none">
                        {formatTime(appt.start_time)}
                      </span>
                      <span className="text-[10px] text-[#6D7175] mt-0.5 leading-none">
                        {formatDate(appt.appointment_date)}
                      </span>
                    </div>

                    {/* Patient Avatar (Using solid dark avatar matching doctor portal) */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {patientInitials}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#202223] truncate">
                            {isBlocked ? '--- BLOCKED SLOT ---' : (appt.patient_name || 'Unknown Patient')}
                          </span>
                          
                          {/* Status Pill */}
                          {!isBlocked && (
                            <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isPending
                                ? 'bg-[#FEF3D6] text-[#B25E09]'
                                : isInProgress
                                ? 'bg-[#D9F7C3] text-[#245B19]'
                                : 'bg-[#EBF3FF] text-[#2F68D6]'
                            }`}>
                              {isPending ? 'Pending Payment' : isInProgress ? 'In Progress' : 'Confirmed'}
                            </span>
                          )}
                        </div>

                        {/* Assigned Doctor & Reason */}
                        <div className="flex items-center gap-2 text-xs text-[#6D7175] mt-0.5 flex-wrap">
                          {appt.doctor_name && (
                            <span className="flex items-center gap-1 font-medium text-[#202223]">
                              <Stethoscope className="w-3 h-3 text-[#4088F8]" />
                              Dr. {appt.doctor_name}
                            </span>
                          )}
                          {appt.reason && (
                            <>
                              <span className="text-[#D1D1D1]">·</span>
                              <span className="truncate max-w-[200px]">{appt.reason}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Actions & Timers */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-[#EAEAEA] shrink-0">
                    
                    {/* Hold Countdown */}
                    {isPending && appt.payment_expires_at && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#B25E09] bg-[#FEF3D6] px-2.5 py-1 rounded-md font-semibold">
                        <Clock className="w-3 h-3" />
                        <span>{formatCountdown(appt.payment_expires_at)}</span>
                      </div>
                    )}

                    {/* Action Buttons (Primary black, Secondary outline) */}
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setPaymentAppointment(appt)}
                            className="btn-primary-saas text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect Payment</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentAppointment(appt)}
                            className="btn-secondary-saas text-[11px] py-1 px-2.5"
                            title="Resend payment link"
                          >
                            <span>Link</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setViewAppointment(appt)}
                          className="btn-secondary-saas text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#6D7175]" />
                          <span>View Details</span>
                        </button>
                      )}

                      {/* Cancel Button */}
                      {!isBlocked && (
                        <button
                          type="button"
                          onClick={() => {
                            const apptDateTime = new Date(`${appt.appointment_date}T${appt.start_time}`);
                            const diffInMinutes = (apptDateTime - new Date()) / (1000 * 60);
                            if (diffInMinutes <= 60 && diffInMinutes > 0) {
                              alert("You cannot cancel an appointment within 60 minutes of the scheduled time.");
                            } else {
                              handleCancelDirectly(appt);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[#E5484D] hover:bg-[#FEF3F2] border border-transparent hover:border-[#FECDCA] text-[11px] font-medium transition-all cursor-pointer"
                          title="Cancel appointment"
                        >
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ── 5. ENTERPRISE PAGINATION BAR ────────────────────────────── */}
        {filteredList.length > 0 && (
          <div className="px-4 py-3 bg-[#F9FAFB] border-t border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6D7175]">
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-[#EAEAEA] rounded-md px-2 py-1 text-xs text-[#202223] focus:outline-none focus:border-[#202223] cursor-pointer"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>

              <span>
                Showing {Math.min(indexOfFirstItem + 1, filteredList.length)}–{Math.min(indexOfLastItem, filteredList.length)} of {filteredList.length}
              </span>
            </div>

            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary-saas text-[11px] py-1 px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-2 py-1 text-xs font-medium text-[#202223]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn-secondary-saas text-[11px] py-1 px-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default ReceptionistDashboard;
