import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import './StartConsultation.css';

const StartConsultation = () => {
  const { appointmentId, patientId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  
  const [appointment, setAppointment] = useState(location.state?.appointment || null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  
  const [overviewData, setOverviewData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [complianceSummary, setComplianceSummary] = useState(null);
  const [logsData, setLogsData] = useState({ summary: [], flagged_entries: [], standalone_concerns: [], grouped_logs: {} });
  const [expandedExercises, setExpandedExercises] = useState({});
  const [flaggedExpanded, setFlaggedExpanded] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const targetPatientId = patientId || appointment?.patient_id;
  const highlightLogId = searchParams.get('highlightLog');

  useEffect(() => {
    if (targetPatientId) {
      fetchPatientData(targetPatientId);
    } else {
      setError("No patient data found. Please go back to the dashboard.");
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
        setError('Failed to load patient data.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred.');
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

  const getComplianceColor = (pct) =>
    pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';

  if (loading) {
    return (
      <div className="consultation-theme" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1rem', display: 'block' }}></i>
          <span style={{ fontFamily: 'var(--font-secondary)', color: 'var(--gray-600)', fontWeight: 600 }}>Loading patient data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="consultation-theme" style={{ padding: '2rem' }}>
        <div style={{ backgroundColor: 'rgba(247, 43, 80, 0.04)', border: '1px solid rgba(247, 43, 80, 0.2)', padding: '1rem 1.5rem', borderRadius: '12px', color: 'var(--danger)', marginBottom: '1rem', fontFamily: 'var(--font-secondary)' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }}></i> {error}
        </div>
        <button onClick={() => navigate('/doctor-dashboard')} className="btn-outline">
          <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
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

  return (
    <div className="consultation-theme">
      {/* FIXED THEME BACKGROUND */}
      <div className="theme-bg" style={{ backgroundImage: 'url(/images/banner/img1.jpg)' }}>
        <img className="pt-img1" style={{ animation: 'left-right 8s infinite ease-in-out' }} src="/images/shap/wave-blue.png" alt=""/>
        <img className="pt-img2" style={{ animation: 'up-down 6s infinite ease-in-out' }} src="/images/shap/circle-dots.png" alt=""/>
        <img className="pt-img3" style={{ animation: 'rotation 20s infinite linear' }} src="/images/shap/plus-blue.png" alt=""/>
        <div className="bg-shape-bottom"></div>
      </div>

      <div className="app-container">

        {/* PATIENT HEADER CARD */}
        <div className="page-header">
          <Link to="/doctor-dashboard" className="back-link">
            <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
          </Link>

          <div className="patient-header-card">
              <div className="card-content">
                  
                  {/* Left Section: Avatar & Info */}
                  <div className="left-section">
                      <div className="avatar">
                          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      </div>

                      <div className="info">
                          <div className="name-row">
                              <h1 className="name">{user?.name || 'Unknown Patient'}</h1>
                              <span className="hc-badge">{isFirstVisit ? 'FIRST VISIT' : 'FOLLOW-UP'}</span>
                          </div>

                          <div className="details-row">
                              <span className="detail-item">
                                  {/* Male Icon */}
                                  <svg viewBox="0 0 24 24"><path d="M9 9c1.29 0 2.5.41 3.47 1.11L17.58 5H14V3h8v8h-2V7.41l-5.11 5.09c.7 1 1.11 2.2 1.11 3.5 0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6zm0 2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/></svg>
                                  {profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not specified'} {age ? `• ${age} yrs` : ''}
                              </span>
                              <span className="detail-item">
                                  {/* Phone Icon */}
                                  <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                                  {user?.phone || 'No phone'}
                              </span>
                              <span className="detail-item">
                                  {/* Calendar Icon */}
                                  <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z"/></svg>
                                  Appt: {appointment?.start_time ? appointment.start_time.substring(0, 5) : '—'}
                              </span>
                          </div>
                      </div>
                  </div>

                  {/* Right Section: Action Button */}
                  {appointment?.status === 'completed' ? (
                      <button className="consult-btn" style={{ backgroundColor: 'var(--success)', cursor: 'default', boxShadow: 'none' }}>
                          <i className="fa-solid fa-check" style={{ fontSize: '18px' }}></i>
                          Consultation Complete
                      </button>
                  ) : patientId ? (
                      null
                  ) : (
                      <button className="consult-btn" onClick={() => navigate(`/doctor-dashboard/consultation/${appointmentId}/new`, { state: { appointment, overviewData } })}>
                          <svg viewBox="0 0 24 24"><path d="M16 2.5C18.48 2.5 20.5 4.52 20.5 7v4.5h-2V7c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5v9c0 2.21-1.79 4-4 4s-4-1.79-4-4V7h2v9c0 1.1.9 2 2 2s2-.9 2-2V7c0-2.48 2.02-4.5 4.5-4.5M8.5 2C9.88 2 11 3.12 11 4.5S9.88 7 8.5 7 6 5.88 6 4.5 7.12 2 8.5 2M18 13.5v3h-3v2h3v3h2v-3h3v-2h-3v-3h-2z"/></svg>
                          Start Consultation
                      </button>
                  )}
              </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="tabs-container" role="tablist">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            role="tab"
          >
            <i className="fa-solid fa-file-lines"></i> Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            role="tab"
          >
            <i className="fa-solid fa-clock-rotate-left"></i> Clinical History
          </button>
          <button
            className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => setActiveTab('compliance')}
            role="tab"
          >
            <i className="fa-solid fa-chart-line"></i> Compliance & Logs
          </button>
        </div>

        {/* ===================== TAB 1: OVERVIEW ===================== */}
        <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`} role="tabpanel">
          <div className="overview-grid">

            {/* LEFT: Medical Profile */}
            <div>
              <div className="card medical-profile-card hoverable">
                <div className="card-title">
                  <i className="fa-solid fa-heart-pulse"></i> Medical Profile
                </div>
                <div className="medical-content">
                  <span className="section-label">Medical History / Notes</span>
                  <p>{profile?.medical_history || 'No medical history recorded.'}</p>
                </div>

                {profile?.emergency_contact_name && (
                  <div className="emergency-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--gray-200)' }}>
                    <span className="section-label">Emergency Contact</span>
                    <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', fontWeight: 500 }}>
                      <i className="fa-solid fa-phone" style={{ color: 'var(--secondary)', marginRight: '0.4rem' }}></i>
                      <strong>{profile.emergency_contact_name}</strong> · {profile.emergency_contact_phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Treatment Plan */}
            <div>
              <div className="card treatment-plan-card hoverable" style={{ animationDelay: '0.1s' }}>
                
                {/* Card Header */}
                <div className="card-title" style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>
                  <i className="fa-solid fa-file-waveform" style={{ color: 'var(--secondary)' }}></i> Current Treatment Plan
                </div>

                {active_plan ? (
                  <>
                    <div className="tp-header">
                      <h3>{active_plan.title || 'Untitled Plan'}</h3>
                      <button onClick={() => setActiveTab('compliance')} className="btn-link">
                        View Details <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>
                    <div className="tp-date">
                      <i className="fa-regular fa-calendar-check"></i> Started {new Date(active_plan.start_date).toLocaleDateString()}
                    </div>

                    {complianceSummary ? (
                      <>
                        {/* Compliance Bar */}
                        <div className="compliance-wrapper">
                          <div className="comp-labels">
                            <span className="section-label" style={{ margin: 0 }}>Overall Compliance</span>
                            <span className="comp-val" style={{ color: getComplianceColor(complianceSummary.overall_compliance) }}>
                              {complianceSummary.overall_compliance}%
                            </span>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${Math.min(100, complianceSummary.overall_compliance)}%`,
                                backgroundColor: getComplianceColor(complianceSummary.overall_compliance)
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Exercises List */}
                        {complianceSummary.exercises?.length > 0 && (
                          <>
                            <span className="section-label">Exercises</span>
                            <div className="exercise-list">
                              {complianceSummary.exercises.map(ex => (
                                <div
                                  key={ex.exercise_id}
                                  className="exercise-item"
                                  style={ex.compliance_percent < 50 ? { borderColor: 'rgba(86,90,207,0.4)', backgroundColor: 'rgba(86,90,207,0.04)' } : {}}
                                >
                                  {ex.exercise_name}
                                  <div className="ex-status" style={{ color: getComplianceColor(ex.compliance_percent) }}>
                                    <div className="ex-dot" style={{ backgroundColor: getComplianceColor(ex.compliance_percent) }}></div>
                                    {ex.compliance_percent >= 80 ? 'Good' : ex.compliance_percent >= 50 ? 'Low' : 'Critical'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Pain Trend */}
                        <span className="section-label">Pain Trend</span>
                        <div className="pain-trend-box">
                          {complianceSummary.pain_trend?.length > 0 ? (
                            <>
                              <span>{complianceSummary.pain_trend[complianceSummary.pain_trend.length - 1].week}: {complianceSummary.pain_trend[complianceSummary.pain_trend.length - 1].avg_pain}</span>
                              {complianceSummary.pain_trend?.length >= 2 ? (() => {
                                const last = complianceSummary.pain_trend[complianceSummary.pain_trend.length - 1].avg_pain;
                                const prev = complianceSummary.pain_trend[complianceSummary.pain_trend.length - 2].avg_pain;
                                if (last > prev) return <span className="status" style={{ color: 'var(--danger)' }}>↑ Increasing</span>;
                                if (last < prev) return <span className="status" style={{ color: 'var(--success)' }}>↓ Improving</span>;
                                return <span className="status">→ Stable</span>;
                              })() : complianceSummary.pain_trend?.length === 1
                                ? <span className="status">→ Stable</span>
                                : null
                              }
                            </>
                          ) : (
                            <>
                              <span>No pain data recorded yet.</span>
                              <span className="status">→ N/A</span>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>No compliance data available yet.</p>
                    )}
                  </>
                ) : (
                  <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>No active treatment plan found.</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ===================== TAB 2: CLINICAL HISTORY ===================== */}
        <div className={`tab-content ${activeTab === 'history' ? 'active' : ''}`} role="tabpanel">
          <h3 className="section-header">
            <i className="fa-solid fa-clock-rotate-left"></i> Past Consultations
          </h3>

          <div className="history-list">
            {!historyData?.consultations?.length ? (
              <div className="card empty-state">
                <i className="fa-regular fa-folder-open"></i>
                <h3>No History Found</h3>
                <p>No past consultations have been recorded for this patient.</p>
              </div>
            ) : (
              historyData.consultations.map((consult, idx) => {
                const linkedPlan = historyData.treatment_plans?.find(p => p.consultation_id === consult.id);
                return (
                  <div key={consult.id} className="history-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="hi-top">
                      <span className="badge outline">
                        <i className="fa-regular fa-calendar" style={{ marginRight: '0.3rem' }}></i>
                        {new Date(consult.consultation_date).toLocaleDateString()}
                      </span>
                      <span className={`badge ${consult.consultation_type === 'initial' ? 'info' : 'warning'}`}>
                        {consult.consultation_type === 'initial' ? 'Initial Visit' : 'Follow-Up'}
                      </span>
                    </div>

                    <div className="hi-title">
                      <i className="fa-solid fa-stethoscope" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}></i>
                      {consult.diagnosis || 'No Diagnosis Recorded'}
                    </div>

                    <div className="hi-notes">
                      <span className="label-sm">Clinical Notes</span>
                      <p>{consult.clinical_notes || 'No notes provided.'}</p>
                    </div>

                    {consult.treatment_recommendations && (
                      <div className="hi-notes">
                        <span className="label-sm">Treatment Recommendations</span>
                        <p>{consult.treatment_recommendations}</p>
                      </div>
                    )}

                    {linkedPlan && (
                      <span className="badge info" style={{ marginTop: '0.5rem' }}>
                        <i className="fa-solid fa-clipboard-list" style={{ marginRight: '0.3rem' }}></i>
                        Plan: {linkedPlan.title || 'Untitled Plan'}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ===================== TAB 3: COMPLIANCE & LOGS ===================== */}
        <div className={`tab-content ${activeTab === 'compliance' ? 'active' : ''}`} role="tabpanel">

          {logsData.summary.length === 0 && logsData.flagged_entries.length === 0 && Object.keys(logsData.grouped_logs).length === 0 ? (
            <div className="card empty-state">
              <i className="fa-solid fa-chart-line"></i>
              <h3>No Logs Yet</h3>
              <p>The patient has not logged any exercise sessions yet.</p>
            </div>
          ) : (
            <>
              {/* Compliance Summary Cards */}
              {logsData.summary.length > 0 && (
                <>
                  <h3 className="section-header">
                    <i className="fa-solid fa-chart-pie"></i> Compliance Summary
                  </h3>
                  <div className="summary-cards-grid">
                    {logsData.summary.map((item, idx) => (
                      <div key={idx} className="card summary-card">
                        <h4 title={item.exercise_name}>{item.exercise_name}</h4>
                        <div className="summary-stats">
                          <div className="stat-block">
                            <span className="label-sm">Sessions</span>
                            <div className="stat-val">
                              {item.completed_sessions} <span>/ {item.expected_sessions}</span>
                            </div>
                          </div>
                          <div className="stat-block" style={{ textAlign: 'right' }}>
                            <span className="label-sm">Avg Sets</span>
                            <div className="stat-val">
                              {item.avg_sets_completed} <span>/ {item.prescribed_sets}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mini-bar">
                          <div
                            className="mini-bar-fill"
                            style={{
                              width: `${Math.min(100, item.compliance_percent)}%`,
                              backgroundColor: getComplianceColor(item.compliance_percent)
                            }}
                          ></div>
                        </div>
                        <div className="card-watermark">{item.compliance_percent}%</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Flagged Entries */}
              {logsData.flagged_entries.length > 0 && (
                <>
                  <h3 className="section-header" style={{ color: 'var(--danger)' }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--danger)' }}></i> Flagged Alerts
                  </h3>
                  <div className="accordion-wrapper" style={{ marginBottom: '2.5rem' }}>
                    <div className={`accordion-item ${flaggedExpanded ? 'open' : ''}`}>
                      <button
                        className="accordion-header"
                        onClick={() => setFlaggedExpanded(!flaggedExpanded)}
                        aria-expanded={flaggedExpanded}
                      >
                        <div className="acc-title">
                          <i className="fa-solid fa-triangle-exclamation" style={{ animation: 'flow-vibrate 0.3s ease-in-out infinite alternate' }}></i>
                          View Flagged Entries
                          <span>({logsData.flagged_entries.length} {logsData.flagged_entries.length === 1 ? 'record' : 'records'})</span>
                        </div>
                        <i className="fa-solid fa-chevron-down acc-icon"></i>
                      </button>
                      <div className="accordion-body">
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {logsData.flagged_entries.map(log => (
                            <div key={log.id} id={`log-${log.id}`} className="flagged-alert" style={{ 
                              marginBottom: 0, 
                              animation: 'none',
                              boxShadow: highlightLogId === log.id ? '0 0 0 4px rgba(247, 43, 80, 0.4)' : 'none',
                              transition: 'box-shadow 0.5s ease'
                            }}>
                              <div className="flagged-row">
                                <div className="flagged-content">
                                  <div className="flagged-top-line">
                                    <span className="flagged-date">
                                      {new Date(log.log_date).toLocaleDateString()}
                                    </span>
                                    <strong>{log.exercise_name}</strong>
                                  </div>
                                  {log.issue_type && (
                                    <span className="flagged-issue" style={{ color: 'var(--text-body)', fontSize: '0.9rem' }}>
                                      Issue: <strong style={{ color: 'var(--dark-brand)' }}>{log.issue_type.replace('_', ' ')}</strong>
                                    </span>
                                  )}
                                  {log.comments && (
                                    <span className="flagged-note" style={{ fontStyle: 'italic', color: 'var(--gray-600)', fontSize: '0.9rem' }}>"{log.comments}"</span>
                                  )}
                                </div>
                                {log.pain_level != null && (
                                  <div
                                    className="pain-pill"
                                    style={{
                                      animation: log.pain_level >= 7 ? 'flow-vibrate 0.3s ease-in-out infinite alternate' : 'none',
                                      backgroundColor: log.pain_level >= 7 ? 'var(--danger)' : 'var(--warning)',
                                      color: '#fff',
                                      padding: '0.4rem 0.8rem',
                                      borderRadius: '25px',
                                      fontWeight: 700,
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    {log.pain_level}/10
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Full Log Drill-Down */}
              {Object.keys(logsData.grouped_logs).length > 0 && (
                <>
                  <h3 className="section-header">
                    <i className="fa-regular fa-file-lines"></i> Full Log Drill-Down
                  </h3>
                  <div className="accordion-wrapper">
                    {Object.entries(logsData.grouped_logs).map(([exerciseName, logs]) => (
                      <div
                        key={exerciseName}
                        className={`accordion-item ${expandedExercises[exerciseName] ? 'open' : ''}`}
                      >
                        <button
                          className="accordion-header"
                          onClick={() => toggleAccordion(exerciseName)}
                          aria-expanded={expandedExercises[exerciseName]}
                        >
                          <div className="acc-title">
                            <i className="fa-solid fa-dumbbell" style={{ fontSize: '0.85rem' }}></i>
                            {exerciseName}
                            <span>({logs.length} {logs.length === 1 ? 'log' : 'logs'})</span>
                          </div>
                          <i className="fa-solid fa-chevron-down acc-icon"></i>
                        </button>
                        <div className="accordion-body">
                          <div style={{ overflowX: 'auto' }}>
                            <table className="log-table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Sets</th>
                                  <th>Reps</th>
                                  <th>Pain Level</th>
                                  <th>Comments / Issue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {logs.map(log => (
                                  <tr key={log.id}>
                                    <td>{new Date(log.log_date).toLocaleDateString()}</td>
                                    <td>{log.sets_completed ?? '—'}</td>
                                    <td>{log.reps_completed ?? '—'}</td>
                                    <td>
                                      {log.pain_level != null ? (
                                        <span
                                          className="pain-pill"
                                          style={{
                                            fontSize: '0.75rem',
                                            height: '26px',
                                            minWidth: '44px',
                                            backgroundColor: log.pain_level >= 7
                                              ? 'var(--danger)'
                                              : log.pain_level > 3
                                              ? 'var(--warning)'
                                              : 'var(--success)'
                                          }}
                                        >
                                          {log.pain_level}/10
                                        </span>
                                      ) : '—'}
                                    </td>
                                    <td className="td-note">
                                      {log.issue_type && (
                                        <div style={{ color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.2rem', fontSize: '0.82rem' }}>
                                          {log.issue_type.replace('_', ' ')}
                                        </div>
                                      )}
                                      {log.comments || <span style={{ color: 'var(--gray-400)' }}>—</span>}
                                    </td>
                                  </tr>
                                ))}
                                {logs.length === 0 && (
                                  <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>
                                      No logs for this exercise.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default StartConsultation;
