import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Loader2, ArrowLeft, Search, User, Phone, Calendar, Stethoscope, FileText,
  Clock, Activity, AlertTriangle, ChevronDown, CheckCircle2,
  HeartPulse, Dumbbell, AlertCircle, ArrowUpRight, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import './StartConsultation.css';

const StartConsultation = () => {
  const { appointmentId, patientId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  
  const [appointment] = useState(location.state?.appointment || null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  
  const [overviewData, setOverviewData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');
  const [collapsedConsultations, setCollapsedConsultations] = useState({});
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [logsData, setLogsData] = useState({ summary: [], flagged_entries: [], standalone_concerns: [], grouped_logs: {} });
  const [expandedExercises, setExpandedExercises] = useState({});
  const [flaggedExpanded, setFlaggedExpanded] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const targetPatientId = patientId || appointment?.patient_id;
  const highlightLogId = searchParams.get('highlightLog');

  useEffect(() => {
    if (targetPatientId) {
      fetchPatientData(targetPatientId);
    } else {
      setError("No patient ID provided. Please return to your patient directory.");
      setLoading(false);
    }
  }, [targetPatientId, getToken]);

  useEffect(() => {
    if (activeTab === 'compliance' && highlightLogId) {
      setTimeout(() => {
        const element = document.getElementById(`log-${highlightLogId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setFlaggedExpanded(true);
        }
      }, 500);
    }
  }, [activeTab, highlightLogId, logsData]);

  const fetchPatientData = async (patientId) => {
    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const [overviewRes, historyRes, compRes, logsRes] = await Promise.all([
        fetch(`${apiUrl}/api/patients/${patientId}/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/patients/${patientId}/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/patients/${patientId}/treatment-plans/active/compliance`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/patients/${patientId}/compliance-logs`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [overviewJson, historyJson, compJson, logsJson] = await Promise.all([
        overviewRes.json(), historyRes.json(), compRes.json(), logsRes.json()
      ]);

      if (overviewJson.success && historyJson.success) {
        setOverviewData(overviewJson.data);
        setHistoryData(historyJson.data);
        if (compJson.success) setComplianceSummary(compJson.data);
        if (logsJson.success) setLogsData(logsJson.data);
      } else {
        setError('Failed to load patient clinical profile.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred while loading patient records.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (exerciseName) => {
    setExpandedExercises(prev => ({
      ...prev,
      [exerciseName]: !prev[exerciseName]
    }));
  };

  const getComplianceColorClass = (pct) => {
    if (pct >= 80) return 'text-[#245B19] bg-[#D9F7C3]';
    if (pct >= 50) return 'text-[#805B00] bg-[#FFF2CC]';
    return 'text-[#B42318] bg-[#FCE4E4]';
  };

  if (loading) {
    return (
      <div className="flex flex-col h-72 items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#202223]" />
        <span className="text-xs text-[#8A8A8A]">Loading patient clinical records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl text-center">
        <div className="w-12 h-12 rounded-full bg-[#FCE4E4] text-[#B42318] flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={22} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#202223] m-0">Record Unavailable</h3>
        <p className="text-[13px] text-[#616161] mt-1 mb-4">{error}</p>
        <button 
          onClick={() => navigate('/doctor-dashboard/patients')} 
          className="btn-secondary-saas inline-flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Back to Patients
        </button>
      </div>
    );
  }

  const { user, profile, active_plan, visit_count } = overviewData || {};
  const isFirstVisit = visit_count === 0;

  const getAge = (dob) => {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };
  const age = getAge(profile?.date_of_birth);
  const avatarInitials = (user?.name || 'UN').substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-6 w-full font-['Inter',system-ui,sans-serif] text-[#202223]">
      
      {/* ── Breadcrumb / Back Link ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link 
          to="/doctor-dashboard/patients" 
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#616161] hover:text-[#202223] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Patients Directory</span>
        </Link>

        <span className="text-[11px] font-mono text-[#8A8A8A]">
          Patient ID: {targetPatientId}
        </span>
      </div>

      {/* ── Patient Header Card ────────────────────────────────────── */}
      <div className="saas-card p-6 bg-[#FFFFFF]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          
          {/* Avatar & Patient Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#111111] text-[#FFFFFF] text-[18px] font-semibold flex items-center justify-center shrink-0 tracking-wider shadow-xs">
              {avatarInitials}
            </div>
            
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[20px] font-semibold text-[#202223] tracking-tight m-0">
                  {user?.name || 'Unknown Patient'}
                </h1>
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isFirstVisit ? 'badge-semantic-info' : 'badge-semantic-neutral'
                }`}>
                  {isFirstVisit ? 'First Visit' : 'Follow-Up'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[#616161] mt-1.5">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-[#8A8A8A]" />
                  {profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Gender unspecified'}
                  {age ? ` • ${age} yrs` : ''}
                </span>

                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-[#8A8A8A]" />
                  {user?.phone || 'No phone registered'}
                </span>

                {appointment?.start_time && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#8A8A8A]" />
                    Appt: <strong className="text-[#202223] font-mono">{appointment.start_time.substring(0, 5)}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button (e.g. Start Consultation) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {appointment?.status === 'completed' ? (
              <span className="badge-semantic-success flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium">
                <CheckCircle2 size={13} /> Consultation Complete
              </span>
            ) : appointmentId ? (
              <button 
                onClick={() => navigate(`/doctor-dashboard/consultation/${appointmentId}/new`, { state: { appointment, overviewData } })}
                className="btn-primary-saas flex items-center gap-2"
              >
                <Stethoscope size={14} />
                <span>Start Consultation</span>
              </button>
            ) : null}
          </div>

        </div>
      </div>

      {/* ── Segmented Navigation Tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#FFFFFF] text-[#202223] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
              : 'text-[#616161] hover:text-[#202223]'
          }`}
        >
          <FileText size={15} />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#FFFFFF] text-[#202223] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
              : 'text-[#616161] hover:text-[#202223]'
          }`}
        >
          <Clock size={15} />
          <span>Clinical History</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === 'compliance'
              ? 'bg-[#FFFFFF] text-[#202223] shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
              : 'text-[#616161] hover:text-[#202223]'
          }`}
        >
          <Activity size={15} />
          <span>Compliance & Logs</span>
          {logsData.flagged_entries?.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#E5484D]" />
          )}
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ─────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          
          {/* Left Column: Medical Profile (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="saas-card p-5">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#EAEAEA]">
                <HeartPulse size={16} className="text-[#616161]" />
                <h3 className="text-[15px] font-semibold text-[#202223] m-0">Medical Profile</h3>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-1.5">
                    Medical History & Clinical Notes
                  </span>
                  <div className="p-3.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl text-[13px] text-[#616161] leading-relaxed">
                    {profile?.medical_history || 'No prior medical conditions or surgical history recorded.'}
                  </div>
                </div>

                {profile?.emergency_contact_name && (
                  <div className="pt-3 border-t border-[#EAEAEA]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-1.5">
                      Emergency Contact
                    </span>
                    <div className="flex items-center justify-between p-3 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl text-[13px]">
                      <div className="font-medium text-[#202223]">
                        {profile.emergency_contact_name}
                      </div>
                      <div className="text-[#616161] font-mono">
                        {profile.emergency_contact_phone || 'No phone'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Current Treatment Plan (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="saas-card p-6">
              
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EAEAEA]">
                <div className="flex items-center gap-2">
                  <Dumbbell size={16} className="text-[#616161]" />
                  <h3 className="text-[15px] font-semibold text-[#202223] m-0">Active Treatment Plan</h3>
                </div>
                {active_plan && (
                  <button 
                    onClick={() => setActiveTab('compliance')}
                    className="text-[12px] font-medium text-[#2C5E91] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Compliance</span>
                    <ArrowUpRight size={13} />
                  </button>
                )}
              </div>

              {active_plan ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-[16px] font-semibold text-[#202223] m-0">
                        {active_plan.title || 'Rehabilitation Plan'}
                      </h4>
                      <span className="text-[12px] text-[#8A8A8A] mt-0.5 block">
                        Prescribed on {new Date(active_plan.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {complianceSummary && (
                      <div className="flex items-center gap-2 bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-1.5 rounded-lg text-[13px]">
                        <span className="text-[#8A8A8A]">Overall Compliance:</span>
                        <strong className="font-semibold text-[#202223] font-mono">
                          {complianceSummary.overall_compliance}%
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {complianceSummary && (
                    <div>
                      <div className="w-full bg-[#EAEAEA] h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#111111] transition-all duration-300"
                          style={{ width: `${Math.min(100, complianceSummary.overall_compliance)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Prescribed Exercises List */}
                  {complianceSummary?.exercises?.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                        Prescribed Regimen ({complianceSummary.exercises.length} exercises)
                      </span>
                      
                      <div className="divide-y divide-[#EAEAEA] border border-[#E5E5E5] rounded-xl overflow-hidden bg-[#FFFFFF]">
                        {complianceSummary.exercises.map(ex => {
                          const pct = ex.compliance_percent;
                          return (
                            <div key={ex.exercise_id} className="p-3 flex items-center justify-between text-[13px] hover:bg-[#F9F9F9] transition-colors">
                              <span className="font-medium text-[#202223]">{ex.exercise_name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                  pct >= 80 ? 'badge-semantic-success' : pct >= 50 ? 'badge-semantic-warning' : 'badge-semantic-error'
                                }`}>
                                  {pct >= 80 ? 'Optimal' : pct >= 50 ? 'Moderate' : 'Critical'}
                                </span>
                                <span className="font-mono text-[#616161] text-[12px]">{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pain Trend Indicator */}
                  <div className="p-3.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2 text-[#616161]">
                      <span>Pain Trajectory:</span>
                      {complianceSummary?.pain_trend?.length > 0 ? (
                        <span className="font-medium text-[#202223]">
                          Week {complianceSummary.pain_trend[complianceSummary.pain_trend.length - 1].week}: Avg Pain {complianceSummary.pain_trend[complianceSummary.pain_trend.length - 1].avg_pain}/10
                        </span>
                      ) : (
                        <span>No pain data recorded yet</span>
                      )}
                    </div>

                    {complianceSummary?.pain_trend?.length >= 2 ? (() => {
                      const last = complianceSummary.pain_trend[complianceSummary.pain_trend.length - 1].avg_pain;
                      const prev = complianceSummary.pain_trend[complianceSummary.pain_trend.length - 2].avg_pain;
                      if (last > prev) {
                        return (
                          <span className="badge-semantic-error flex items-center gap-1 text-[11px]">
                            <TrendingUp size={12} /> Increasing Pain
                          </span>
                        );
                      }
                      if (last < prev) {
                        return (
                          <span className="badge-semantic-success flex items-center gap-1 text-[11px]">
                            <TrendingDown size={12} /> Improving
                          </span>
                        );
                      }
                      return (
                        <span className="badge-semantic-neutral flex items-center gap-1 text-[11px]">
                          <Minus size={12} /> Stable
                        </span>
                      );
                    })() : null}
                  </div>

                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Dumbbell size={24} className="text-[#CCCCCC] mb-2" />
                  <h4 className="text-[14px] font-semibold text-[#202223] m-0">No Active Treatment Plan</h4>
                  <p className="text-[12px] text-[#616161] mt-1 max-w-xs">
                    Start a consultation to evaluate the patient and prescribe a custom rehabilitation plan.
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: CLINICAL HISTORY ─────────────────────────────────── */}
      {activeTab === 'history' && (() => {
        const allConsultations = historyData?.consultations || [];
        const filteredConsultations = allConsultations.filter(c => {
          if (historyTypeFilter !== 'all' && c.consultation_type !== historyTypeFilter) return false;
          if (!historySearch.trim()) return true;
          const q = historySearch.toLowerCase();
          return (
            (c.diagnosis || '').toLowerCase().includes(q) ||
            (c.clinical_notes || '').toLowerCase().includes(q) ||
            (c.treatment_recommendations || '').toLowerCase().includes(q)
          );
        });

        const initialCount = allConsultations.filter(c => c.consultation_type === 'initial').length;
        const followUpCount = allConsultations.filter(c => c.consultation_type === 'follow_up').length;

        return (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Header with Title & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAEAEA]">
              <div>
                <h3 className="text-[17px] font-semibold text-[#202223] tracking-tight m-0">
                  Past Consultations & Clinical Ledger
                </h3>
                <p className="text-[12px] text-[#616161] mt-0.5 m-0">
                  Chronological examination records, objective physical findings, and prescribed interventions.
                </p>
              </div>
              <span className="badge-semantic-neutral self-start sm:self-center font-mono">
                {allConsultations.length} records on file
              </span>
            </div>

            {/* Interactive Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAFA] p-2.5 rounded-xl border border-[#E5E5E5]">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                <input
                  type="text"
                  placeholder="Filter by diagnosis, clinical notes, recommendations..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg text-[#202223] placeholder-[#8A8A8A] outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setHistoryTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    historyTypeFilter === 'all'
                      ? 'bg-[#111111] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] text-[#616161] hover:text-[#202223] border border-[#E5E5E5]'
                  }`}
                >
                  All ({allConsultations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTypeFilter('initial')}
                  className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    historyTypeFilter === 'initial'
                      ? 'bg-[#1E40AF] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] text-[#616161] hover:text-[#202223] border border-[#E5E5E5]'
                  }`}
                >
                  Initial Visits ({initialCount})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTypeFilter('follow_up')}
                  className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    historyTypeFilter === 'follow_up'
                      ? 'bg-[#805B00] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] text-[#616161] hover:text-[#202223] border border-[#E5E5E5]'
                  }`}
                >
                  Follow-ups ({followUpCount})
                </button>
              </div>
            </div>

            {/* Consultations List */}
            {allConsultations.length === 0 ? (
              <div className="saas-card py-16 px-6 flex flex-col items-center justify-center text-center">
                <Clock size={24} className="text-[#CCCCCC] mb-2" />
                <h4 className="text-[15px] font-semibold text-[#202223] m-0">No Past Consultations</h4>
                <p className="text-[13px] text-[#616161] mt-1 max-w-sm">
                  No past consultations recorded for this patient. Completed consultations will be catalogued here.
                </p>
              </div>
            ) : filteredConsultations.length === 0 ? (
              <div className="saas-card py-12 px-6 flex flex-col items-center justify-center text-center">
                <Search size={20} className="text-[#8A8A8A] mb-2" />
                <span className="text-[14px] font-semibold text-[#202223]">No matching consultation records</span>
                <span className="text-[12px] text-[#616161] mt-0.5">Try clearing your search query or switching filters</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredConsultations.map((consult) => {
                  const linkedPlan = historyData.treatment_plans?.find(p => p.consultation_id === consult.id);
                  const isInitial = consult.consultation_type === 'initial';
                  const isCollapsed = !!collapsedConsultations[consult.id];

                  return (
                    <div 
                      key={consult.id} 
                      className={`saas-card overflow-hidden bg-[#FFFFFF] transition-all hover:border-[#D0D0D0] hover:shadow-xs border-l-4 ${
                        isInitial ? 'border-l-[#4088F8]' : 'border-l-[#F5C451]'
                      }`}
                    >
                      {/* Top Header Card Strip */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAEAEA]">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isInitial 
                              ? 'bg-[#EBF3FE] text-[#1E40AF]' 
                              : 'bg-[#FFF2CC] text-[#805B00]'
                          }`}>
                            <Stethoscope size={18} />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-[16px] font-semibold text-[#202223] tracking-tight m-0">
                                {consult.diagnosis || 'Clinical Assessment'}
                              </h4>
                              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isInitial ? 'badge-semantic-info' : 'badge-semantic-warning'
                              }`}>
                                {isInitial ? 'Initial Assessment' : 'Follow-up Visit'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[12px] text-[#616161] mt-1">
                              <Calendar size={13} className="text-[#8A8A8A]" />
                              <span className="font-mono">
                                {new Date(consult.consultation_date).toLocaleDateString('en-GB', { 
                                  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
                                })}
                              </span>
                              {consult.consultation_time && (
                                <span className="font-mono">• {consult.consultation_time}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Action: Expand/Collapse & Linked Plan Indicator */}
                        <div className="flex items-center gap-2.5 self-end sm:self-center">
                          {linkedPlan && (
                            <span className="badge-semantic-success flex items-center gap-1.5 text-[11px] py-1 px-2.5">
                              <Dumbbell size={11} /> Plan: {linkedPlan.title || 'Attached'}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setCollapsedConsultations(prev => ({ ...prev, [consult.id]: !prev[consult.id] }))}
                            className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F0F0F0] text-[#616161] hover:text-[#202223] transition-colors cursor-pointer"
                            aria-label="Toggle details"
                          >
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Content Area */}
                      {!isCollapsed && (
                        <div className="p-4 sm:p-5 flex flex-col gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                            
                            {/* Clinical Notes Card */}
                            <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-[#202223] font-semibold text-[12px] uppercase tracking-wider">
                                <FileText size={14} className="text-[#4088F8]" />
                                <span>Doctor's Examination & Subjective Notes</span>
                              </div>
                              <p className="text-[13px] text-[#616161] leading-relaxed m-0 whitespace-pre-line font-normal">
                                {consult.clinical_notes || 'No detailed clinical notes recorded.'}
                              </p>
                            </div>

                            {/* Recommendations Card */}
                            <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-[#202223] font-semibold text-[12px] uppercase tracking-wider">
                                <CheckCircle2 size={14} className="text-[#245B19]" />
                                <span>Prescription & Therapeutic Recommendations</span>
                              </div>
                              <p className="text-[13px] text-[#616161] leading-relaxed m-0 whitespace-pre-line font-normal">
                                {consult.treatment_recommendations || 'Standard home exercise program prescribed.'}
                              </p>
                            </div>

                          </div>

                          {/* Footer with linked plan and quick navigation */}
                          {linkedPlan && (
                            <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-[12px]">
                              <span className="text-[#8A8A8A]">
                                Prescribed Protocol: <strong className="text-[#202223]">{linkedPlan.title}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveTab('overview')}
                                className="text-[#2C5E91] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <span>Inspect Active Plan</span>
                                <ArrowUpRight size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── TAB 3: COMPLIANCE & LOGS ───────────────────────────────── */}
      {activeTab === 'compliance' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {logsData.summary.length === 0 && logsData.flagged_entries.length === 0 && Object.keys(logsData.grouped_logs).length === 0 ? (
            <div className="saas-card py-16 px-6 flex flex-col items-center justify-center text-center">
              <Activity size={24} className="text-[#CCCCCC] mb-2" />
              <h4 className="text-[15px] font-semibold text-[#202223] m-0">No Compliance Logs Yet</h4>
              <p className="text-[13px] text-[#616161] mt-1 max-w-sm">
                Patient has not completed or submitted any home rehabilitation exercise sessions yet.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Compliance Metric Cards */}
              {logsData.summary.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#EAEAEA]">
                    <h3 className="text-[15px] font-semibold text-[#202223] m-0">
                      Exercise Compliance Summary
                    </h3>
                    <span className="text-[12px] text-[#8A8A8A]">
                      {logsData.summary.length} active targets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {logsData.summary.map((item, idx) => (
                      <div key={idx} className="saas-card p-4 flex flex-col justify-between gap-3 bg-[#FFFFFF]">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-[14px] font-semibold text-[#202223] m-0 truncate" title={item.exercise_name}>
                              {item.exercise_name}
                            </h4>
                            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                              getComplianceColorClass(item.compliance_percent)
                            }`}>
                              {item.compliance_percent}%
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#EAEAEA] text-[12px]">
                            <div>
                              <span className="text-[#8A8A8A] block">Sessions</span>
                              <span className="font-medium text-[#202223] font-mono">
                                {item.completed_sessions} <span className="text-[#8A8A8A]">/ {item.expected_sessions}</span>
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[#8A8A8A] block">Avg Sets</span>
                              <span className="font-medium text-[#202223] font-mono">
                                {item.avg_sets_completed} <span className="text-[#8A8A8A]">/ {item.prescribed_sets}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#EAEAEA] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#111111]"
                            style={{ width: `${Math.min(100, item.compliance_percent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Flagged Pain & Discomfort Alerts */}
              {logsData.flagged_entries.length > 0 && (
                <div className="saas-card overflow-hidden bg-[#FFFFFF]">
                  <button
                    type="button"
                    onClick={() => setFlaggedExpanded(!flaggedExpanded)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAFAFA] transition-colors cursor-pointer border-b border-[#EAEAEA]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-[#FCE4E4] text-[#B42318]">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <span className="text-[14px] font-semibold text-[#202223] block">
                          Flagged Patient Alerts ({logsData.flagged_entries.length})
                        </span>
                        <span className="text-[12px] text-[#8A8A8A]">
                          Instances where pain level reached ≥ 7/10 or patient reported severe difficulty.
                        </span>
                      </div>
                    </div>
                    <ChevronDown size={18} className={`text-[#616161] transition-transform ${flaggedExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {flaggedExpanded && (
                    <div className="p-4 flex flex-col gap-2.5 bg-[#FFFFFF]">
                      {logsData.flagged_entries.map(log => (
                        <div 
                          key={log.id} 
                          id={`log-${log.id}`} 
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            highlightLogId === String(log.id)
                              ? 'bg-[#FFF2CC] border-[#F5C451] shadow-xs'
                              : 'bg-[#FCFCFC] border-[#E5E5E5]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-mono text-[#8A8A8A]">
                                {new Date(log.log_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                              <strong className="text-[13px] text-[#202223]">{log.exercise_name}</strong>
                              {log.issue_type && (
                                <span className="badge-semantic-error text-[10px]">
                                  {log.issue_type.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            {log.comments && (
                              <p className="text-[12px] text-[#616161] italic m-0">
                                "{log.comments}"
                              </p>
                            )}
                          </div>

                          {log.pain_level != null && (
                            <span className="badge-semantic-error font-mono text-[12px] shrink-0 self-start sm:self-center">
                              Pain: {log.pain_level}/10
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Full Log Drill-Down */}
              {Object.keys(logsData.grouped_logs).length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#EAEAEA]">
                    <h3 className="text-[15px] font-semibold text-[#202223] m-0">
                      Detailed Exercise Logs
                    </h3>
                    <span className="text-[12px] text-[#8A8A8A]">
                      Full patient workout telemetry
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {Object.entries(logsData.grouped_logs).map(([exerciseName, logs]) => {
                      const isExpanded = !!expandedExercises[exerciseName];
                      return (
                        <div key={exerciseName} className="saas-card overflow-hidden bg-[#FFFFFF]">
                          <button
                            type="button"
                            onClick={() => toggleAccordion(exerciseName)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAFAFA] transition-colors cursor-pointer border-b border-[#EAEAEA]"
                          >
                            <div className="flex items-center gap-2">
                              <Dumbbell size={15} className="text-[#616161]" />
                              <span className="text-[14px] font-semibold text-[#202223]">
                                {exerciseName}
                              </span>
                              <span className="text-[12px] text-[#8A8A8A] font-mono">
                                ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})
                              </span>
                            </div>
                            <ChevronDown size={18} className={`text-[#616161] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {isExpanded && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-[13px] border-collapse">
                                <thead>
                                  <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA] text-[#8A8A8A] text-[11px] font-semibold uppercase tracking-wider">
                                    <th className="py-2.5 px-4">Date</th>
                                    <th className="py-2.5 px-4">Sets</th>
                                    <th className="py-2.5 px-4">Reps</th>
                                    <th className="py-2.5 px-4">Pain Level</th>
                                    <th className="py-2.5 px-4">Patient Feedback</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EAEAEA]">
                                  {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-[#F9F9F9] transition-colors">
                                      <td className="py-2.5 px-4 font-mono text-[#616161] text-[12px]">
                                        {new Date(log.log_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                      </td>
                                      <td className="py-2.5 px-4 font-medium text-[#202223]">
                                        {log.sets_completed ?? '—'}
                                      </td>
                                      <td className="py-2.5 px-4 font-medium text-[#202223]">
                                        {log.reps_completed ?? '—'}
                                      </td>
                                      <td className="py-2.5 px-4">
                                        {log.pain_level != null ? (
                                          <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md ${
                                            log.pain_level >= 7
                                              ? 'badge-semantic-error'
                                              : log.pain_level > 3
                                              ? 'badge-semantic-warning'
                                              : 'badge-semantic-success'
                                          }`}>
                                            {log.pain_level}/10
                                          </span>
                                        ) : '—'}
                                      </td>
                                      <td className="py-2.5 px-4 text-[#616161]">
                                        {log.issue_type && (
                                          <span className="font-medium text-[#202223] mr-2 block text-[11px]">
                                            [{log.issue_type.replace('_', ' ')}]
                                          </span>
                                        )}
                                        {log.comments || '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}

    </div>
  );
};

export default StartConsultation;
