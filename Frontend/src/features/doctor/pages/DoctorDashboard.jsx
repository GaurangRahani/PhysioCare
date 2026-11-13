import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  Calendar, 
  Loader2, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Stethoscope, 
  Search, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AlertReviewModal from '../components/AlertReviewModal';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'scheduled', 'completed'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const [apptsRes, alertsRes] = await Promise.all([
        fetch(`${apiUrl}/api/appointments?date=today`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/alerts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const apptsData = await apptsRes.json();
      const alertsData = await alertsRes.json();

      if (apptsData.success) {
        setAppointments(apptsData.appointments || []);
      } else {
        setError(apptsData.message || 'Failed to fetch appointments.');
      }

      if (alertsData.success) {
        setAlerts(alertsData.alerts || []);
      }
    } catch (err) {
      console.error("DoctorDashboard error:", err);
      setError('A network error occurred while loading your schedule.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      // Exclude cancelled and no_show unless specifically asked
      if (['cancelled', 'no_show'].includes(a.status)) return false;

      // Status filter
      if (statusFilter === 'scheduled' && a.status !== 'scheduled') return false;
      if (statusFilter === 'completed' && a.status !== 'completed') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const patientMatch = (a.patient_name || '').toLowerCase().includes(query);
        const reasonMatch = (a.visit_reason || '').toLowerCase().includes(query);
        const diagnosisMatch = (a.diagnosis || '').toLowerCase().includes(query);
        return patientMatch || reasonMatch || diagnosisMatch;
      }
      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  // Derived metrics
  const todayCount = appointments.filter(a => !['cancelled', 'no_show'].includes(a.status)).length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const pendingAlertsCount = alerts.length;

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (appt) => {
    if (appt.status === 'completed') {
      return (
        <span className="badge-semantic-success">
          <CheckCircle2 size={11} /> Completed
        </span>
      );
    }
    if (appt.status === 'blocked') {
      return (
        <span className="badge-semantic-error">
          Blocked
        </span>
      );
    }
    if (appt.payment_status === 'pending') {
      return (
        <span className="badge-semantic-warning">
          Payment Pending
        </span>
      );
    }
    return (
      <span className="badge-semantic-neutral">
        Scheduled
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-9 pb-16 font-['Inter',system-ui,sans-serif]">
      
      {/* ── 1. HERO GREETING SECTION (Matches Screenshot Hero) ─────────── */}
      <section className="flex flex-col items-center justify-center text-center pt-6 pb-2">
        <h1 className="text-[26px] md:text-[30px] font-semibold text-[#202223] tracking-tight m-0">
          {greeting}!
        </h1>
        <p className="text-[15px] md:text-[16px] text-[#616161] font-normal mt-1.5 max-w-xl">
          Let’s continue advancing your patients’ physical recovery.
        </p>
      </section>

      {/* ── 2. CENTRAL QUICK-ACTION WIDGET ("Work with Sidekick" Style) ─── */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-[16px] p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#D5D5D5] transition-all">
          <div className="flex items-center gap-2.5 px-2">
            <Search size={15} className="text-[#8A8A8A] shrink-0" />
            <input 
              id="clinical-quick-search"
              type="text"
              placeholder="Search patients by name, condition, or jump to treatment plan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-[13px] text-[#202223] placeholder-[#8A8A8A] bg-transparent border-none outline-none focus:ring-0"
            />
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#F0F0F0] flex items-center justify-between text-[12px] px-1">
            <div className="flex items-center gap-1.5 text-[#616161]">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-[#F7F7F7] border border-[#E5E5E5]">
                <Sparkles size={11} className="text-[#202223]" />
              </span>
              <span className="text-[11px] font-medium text-[#616161]">Practice Assistant</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[12px] text-[#616161] hover:text-[#202223] px-2 py-1 rounded hover:bg-[#F0F0F0] transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => navigate('/doctor-dashboard/patients')}
                className="text-[12px] font-medium text-[#202223] bg-[#F7F7F7] hover:bg-[#EFEFEF] border border-[#E5E5E5] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
              >
                <span>Patients Roster</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. 3-CARD HIGHLIGHT GRID (Matches 3 Cards in Screenshot) ─────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Today's Appointments */}
        <div className="saas-card p-5 flex flex-col justify-between h-[210px] bg-[#FFFFFF]">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium tracking-wide uppercase text-[#8A8A8A]">
                Clinical Queue
              </span>
              <span className="text-[11px] font-semibold text-[#245B19] bg-[#D9F7C3] px-2 py-0.5 rounded-full">
                {todayCount} Today
              </span>
            </div>
            <h3 className="text-[16px] font-semibold text-[#202223] m-0">
              Today's Consultations
            </h3>
            <p className="text-[13px] text-[#616161] font-normal mt-1.5 line-clamp-2 leading-relaxed">
              Review patient clinical profiles, record diagnostic notes, and issue updated treatment plans.
            </p>
          </div>

          <div className="pt-3 border-t border-[#F0F0F0]">
            <button 
              onClick={() => {
                const el = document.getElementById('appointments-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-secondary-saas w-full justify-between"
            >
              <span>View Today's Queue</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 2: Red-Flag Alerts */}
        <div className="saas-card p-5 flex flex-col justify-between h-[210px] bg-[#FFFFFF]">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium tracking-wide uppercase text-[#8A8A8A]">
                Patient Monitoring
              </span>
              {pendingAlertsCount > 0 ? (
                <span className="text-[11px] font-semibold text-[#B42318] bg-[#FCE4E4] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]" />
                  {pendingAlertsCount} Action Required
                </span>
              ) : (
                <span className="text-[11px] font-medium text-[#245B19] bg-[#D9F7C3] px-2 py-0.5 rounded-full">
                  All Clear
                </span>
              )}
            </div>
            <h3 className="text-[16px] font-semibold text-[#202223] m-0">
              Red-Flag Alerts
            </h3>
            <p className="text-[13px] text-[#616161] font-normal mt-1.5 line-clamp-2 leading-relaxed">
              Live notifications from home logs when patients report high pain (≥ 8/10) or acute new symptoms.
            </p>
          </div>

          <div className="pt-3 border-t border-[#F0F0F0]">
            <button 
              onClick={() => {
                if (alerts.length > 0) {
                  setSelectedAlert(alerts[0]);
                } else {
                  navigate('/doctor-dashboard/patients');
                }
              }}
              className="btn-secondary-saas w-full justify-between"
            >
              <span>{pendingAlertsCount > 0 ? `Review Alerts (${pendingAlertsCount})` : 'Check Alert History'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 3: Rehab Exercise Library */}
        <div className="saas-card p-5 flex flex-col justify-between h-[210px] bg-[#FFFFFF]">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium tracking-wide uppercase text-[#8A8A8A]">
                Exercise Prescriptions
              </span>
              <span className="text-[11px] font-medium text-[#555555] bg-[#EEEEEE] px-2 py-0.5 rounded-full">
                Video Library
              </span>
            </div>
            <h3 className="text-[16px] font-semibold text-[#202223] m-0">
              Exercise Library & Plans
            </h3>
            <p className="text-[13px] text-[#616161] font-normal mt-1.5 line-clamp-2 leading-relaxed">
              Prescribe multi-week recovery routines, target muscle groups, and configure sets/reps.
            </p>
          </div>

          <div className="pt-3 border-t border-[#F0F0F0]">
            <button 
              onClick={() => navigate('/doctor-dashboard/exercise-library')}
              className="btn-secondary-saas w-full justify-between"
            >
              <span>Manage Exercise Library</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </section>

      {/* ── 4. TODAY'S CLINICAL QUEUE TABLE ─────────────────────────────── */}
      <section id="appointments-section" className="saas-card bg-[#FFFFFF] overflow-hidden">
        
        {/* Table Control Header */}
        <div className="p-4 md:p-5 border-b border-[#EAEAEA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FFFFFF]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#202223] m-0">
              Today's Scheduled Appointments
            </h2>
            <p className="text-[12px] text-[#616161] font-normal mt-0.5">
              Showing active consultations for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            {/* Filter Pill Tabs */}
            <div className="flex items-center bg-[#F7F7F7] border border-[#E5E5E5] p-0.5 rounded-lg text-[12px]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                  statusFilter === 'all' 
                    ? 'bg-[#FFFFFF] font-medium text-[#202223] shadow-xs' 
                    : 'text-[#616161] hover:text-[#202223]'
                }`}
              >
                All ({appointments.length})
              </button>
              <button
                onClick={() => setStatusFilter('scheduled')}
                className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                  statusFilter === 'scheduled' 
                    ? 'bg-[#FFFFFF] font-medium text-[#202223] shadow-xs' 
                    : 'text-[#616161] hover:text-[#202223]'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                  statusFilter === 'completed' 
                    ? 'bg-[#FFFFFF] font-medium text-[#202223] shadow-xs' 
                    : 'text-[#616161] hover:text-[#202223]'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-[#8A8A8A] gap-2">
              <Loader2 size={18} className="animate-spin text-[#202223]" />
              <span className="text-xs">Loading today's clinical queue...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-[#B42318] bg-[#FCE4E4] m-4 rounded-lg text-xs">
              {error}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#8A8A8A] mb-3">
                <Calendar size={18} />
              </div>
              <h4 className="text-[14px] font-semibold text-[#202223] m-0">No Appointments Match Filter</h4>
              <p className="text-[12px] text-[#8A8A8A] max-w-sm mt-1">
                {searchQuery ? `No patient matches "${searchQuery}".` : "There are no appointments scheduled for this view today."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F7F7F7] border-b border-[#EAEAEA] text-[#616161] text-[12px] font-medium">
                  <th className="py-2.5 px-4 font-medium">Slot Time</th>
                  <th className="py-2.5 px-4 font-medium">Patient Details</th>
                  <th className="py-2.5 px-4 font-medium">Visit Type</th>
                  <th className="py-2.5 px-4 font-medium">Condition / Diagnosis</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">Clinical Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {paginatedAppointments.map((appt) => {
                  const isBlocked = appt.status === 'blocked';
                  const isCompleted = appt.status === 'completed';
                  const isFirstVisit = appt.past_consultations_count === 0;

                  return (
                    <tr 
                      key={appt.id} 
                      className={`hover:bg-[#F8F8F8] transition-colors ${isBlocked ? 'opacity-50 bg-[#FBFBFB]' : ''}`}
                    >
                      {/* Slot Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-[#202223]">
                          <Clock size={13} className="text-[#8A8A8A]" />
                          <span>{formatTime(appt.start_time)}</span>
                        </div>
                      </td>

                      {/* Patient Details */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className={`font-semibold text-[#202223] ${isBlocked ? 'line-through text-[#8A8A8A]' : ''}`}>
                            {isBlocked ? 'Blocked Slot' : (appt.patient_name || 'Walk-In Patient')}
                          </span>
                          {!isBlocked && appt.patient_phone && (
                            <span className="text-[11px] text-[#8A8A8A] font-mono mt-0.5">
                              {appt.patient_phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Visit Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {!isBlocked ? (
                          <span className={isFirstVisit ? 'badge-semantic-neutral' : 'badge-semantic-success'}>
                            {isFirstVisit ? 'First Visit' : 'Follow-Up'}
                          </span>
                        ) : (
                          <span className="text-[#8A8A8A] text-xs">—</span>
                        )}
                      </td>

                      {/* Diagnosis / Notes */}
                      <td className="py-3 px-4 max-w-xs truncate">
                        <span className="text-[#616161]">
                          {appt.diagnosis || appt.visit_reason || 'Initial Assessment'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(appt)}
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isBlocked ? (
                          <span className="text-[11px] text-[#8A8A8A]">Unavailable</span>
                        ) : isCompleted ? (
                          <button 
                            onClick={() => navigate(`/doctor-dashboard/consultation/${appt.id}`, { state: { appointment: appt } })}
                            className="text-[12px] font-medium text-[#2C5E91] hover:underline cursor-pointer"
                          >
                            Review Notes
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/doctor-dashboard/consultation/${appt.id}`, { state: { appointment: appt } })}
                            className="btn-primary-saas text-[12px] py-1.5 px-3"
                          >
                            <Stethoscope size={13} />
                            <span>Start Consultation</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {filteredAppointments.length > 0 && (
          <div className="p-3.5 border-t border-[#EAEAEA] flex items-center justify-between text-[12px] text-[#616161] bg-[#FFFFFF]">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#FFFFFF] border border-[#E5E5E5] rounded px-1.5 py-0.5 text-[#202223] text-xs outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-3">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-[#E5E5E5] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F0F0F0] text-[#202223] transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded border border-[#E5E5E5] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F0F0F0] text-[#202223] transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* ── 5. ALERT REVIEW MODAL (If triggered) ────────────────────────── */}
      {selectedAlert && (
        <AlertReviewModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onSuccess={() => {
            setSelectedAlert(null);
            fetchDashboardData();
          }}
        />
      )}

    </div>
  );
};

export default DoctorDashboard;