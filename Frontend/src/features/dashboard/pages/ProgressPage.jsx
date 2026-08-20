import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { format, isFuture as isDateFuture } from 'date-fns';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import './ProgressPage.css';

const ProgressPage = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({});

  const toggleLogExpand = (name) => {
    setExpandedLogs(prev => ({ ...prev, [name]: !prev[name] }));
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileResponse.ok) throw new Error('Failed to fetch patient profile');
      const profileData = await profileResponse.json();
      if (!profileData.profile) throw new Error('Patient profile not found. Please complete onboarding.');
      const patientId = profileData.user.id;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${patientId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          setData(null);
          return;
        }
        throw new Error(json.message || 'Failed to fetch progress');
      }
      
      setData(json);

      // Auto-select today if there's any data
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      setSelectedDateStr(todayStr);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: '1rem', color: 'var(--danger-color)', background: 'var(--danger-light)', borderRadius: '8px' }}>{error}</div>;
  }

  if (!data?.plan) {
    return (
      <div className="progress-page-wrapper">
        <div className="dashboard-layout-inner" style={{ margin: '0 auto', paddingTop: '3rem' }}>
          <div className="empty-state" style={{ width: '100%' }}>
            <i className="fa-regular fa-folder-open"></i>
            No active treatment plan found. Check back later!
          </div>
        </div>
      </div>
    );
  }

  const { plan, overallCompliance, exercises, painTrend, calendarData, pastPlans } = data;
  const daysLeft = Math.max(0, Math.ceil((new Date(plan.end_date) - new Date()) / 86400000));

  const formatFreq = (type) => {
    const map = {
      daily: 'Daily',
      alternate_days: 'Alternate Days',
      mon_wed_fri: 'Mon/Wed/Fri',
      tue_thu_sat: 'Tue/Thu/Sat',
      custom_days: 'Custom Days'
    };
    return map[type] || type;
  };

  const getComplianceFill = (pct) => {
    if (pct >= 80) return 'fill-success';
    if (pct >= 50) return 'fill-warning';
    return 'fill-danger';
  };

  const getPainColor = (pain) => {
    if (pain <= 3) return 'var(--success-color)';
    if (pain <= 6) return 'var(--warning-color)';
    return 'var(--danger-color)';
  };

  // 1. Calendar Logic
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const generateCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ empty: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i), 'yyyy-MM-dd');
      const dayRows = calendarData.filter(r => r.scheduled_date.split('T')[0] === dateStr);
      const isFuture = isDateFuture(new Date(dateStr)) && format(new Date(), 'yyyy-MM-dd') !== dateStr;

      let dotType = 'rest';
      if (dayRows.length > 0) {
        if (isFuture) {
          dotType = 'future';
        } else {
          const completed = dayRows.filter(r => r.status === 'completed').length;
          const total = dayRows.length;
          if (completed === total) dotType = 'dot-complete';
          else if (completed > 0) dotType = 'dot-partial';
          else dotType = 'dot-missed';
        }
      }

      days.push({
        date: i,
        dateStr,
        dotType,
        isFuture,
        sessions: dayRows
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // 2. Chart Logic (Daily Pain vs Compliance)
  const chartData = [];
  const chartDaysCount = 10;
  for (let i = chartDaysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayLabel = format(d, 'dd MMM'); 

    const dayRows = calendarData.filter(r => r.scheduled_date.split('T')[0] === dateStr);
    
    let avgPain = 0;
    let compliance = 0;
    
    if (dayRows.length > 0) {
      const completed = dayRows.filter(r => r.status === 'completed' || r.sets_completed > 0).length;
      compliance = Math.round((completed / dayRows.length) * 100);
      
      const rowsWithPain = dayRows.filter(r => r.pain_level !== null);
      if (rowsWithPain.length > 0) {
        avgPain = rowsWithPain.reduce((sum, r) => sum + r.pain_level, 0) / rowsWithPain.length;
      }
    }

    chartData.push({
      name: dayLabel,
      pain: parseFloat(avgPain.toFixed(1)),
      compliance: compliance
    });
  }

  // 3. Find logs/concerns for selected date
  const selectedDaySessions = calendarData.filter(r => r.scheduled_date.split('T')[0] === selectedDateStr);
  const selectedDayLogs = selectedDaySessions.filter(s => s.pain_level !== null || s.issue_type || s.comments);

  const groupedLogs = {};
  selectedDayLogs.forEach(log => {
    const name = log.exercise_name || 'Reported Concern';
    if (!groupedLogs[name]) groupedLogs[name] = [];
    groupedLogs[name].push(log);
  });

  return (
    <div className="progress-page-wrapper">
      <div className="main-container dashboard-layout-inner" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* Animated Background Shapes */}
        <div className="shape shape-circle"></div>
        <div className="shape shape-plus"></div>

        {/* ROW 1: Header */}
        <div className="page-header" style={{ marginBottom: '0.5rem' }}>
          <h1>Progress & History</h1>
        </div>

        {/* ROW 2: Chart (Left) & Active Checklist (Right) */}
        <div className="layout-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(350px, 450px)', gap: '2.5rem', width: '100%' }}>
          
          <main className="main-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* 1. YOUR PAIN TREND */}
            <section style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="section-label">Your Pain Trend</span>
              <div className="data-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-header-row" style={{ marginBottom: 0 }}>
                  <div>
                    <h3 className="card-title">Daily Overview</h3>
                    <div className="card-subtitle">Exercise completion vs. Reported Pain</div>
                  </div>
                </div>

                <div className="chart-container" style={{ height: '450px' }}>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--gray-500)', fontSize: 12, fontWeight: 600, fontFamily: 'Montserrat' }}
                          dy={10}
                        />
                        <YAxis yAxisId="left" hide domain={[0, 100]} />
                        <YAxis yAxisId="right" orientation="right" hide domain={[0, 10]} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                          cursor={{ fill: 'var(--gray-100)' }}
                        />

                        <Bar yAxisId="left" dataKey="compliance" name="Compliance %" fill="var(--primary-light)" radius={[4, 4, 0, 0]} barSize={30} />
                        <Line yAxisId="right" type="monotone" dataKey="pain" name="Pain Level" stroke="var(--warning-color)" strokeWidth={3} dot={{ stroke: 'var(--warning-color)', strokeWidth: 2, fill: 'var(--body-bg)', r: 4 }} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gray-500)' }}>
                      No pain trend data available yet.
                    </div>
                  )}
                </div>

                <div className="chart-legend">
                  <div className="chart-legend-item">
                    <div className="legend-color" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-color)' }}></div> Exercise Completion
                  </div>
                  <div className="chart-legend-item">
                    <div className="legend-color" style={{ background: 'var(--warning-color)' }}></div> Pain Level
                  </div>
                </div>

                <div className="trend-box">
                  <i className="fa-solid fa-arrow-trend-down" style={{ color: 'var(--success-color)' }}></i>
                  <span>Insight: Consistent compliance helps lower pain levels over time. Keep monitoring!</span>
                </div>
              </div>
            </section>
          </main>

          <aside className="right-sidebar" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Dummy section label to perfectly align with the left column's box */}
            <span className="section-label" style={{ visibility: 'hidden' }}>Spacer</span>
            
            {/* Hardcode exact height of the chart box (654px) so it never disappears or expands */}
            <div className="widget-panel" style={{ height: '654px', display: 'flex', flexDirection: 'column', margin: 0 }}>
              <div className="widget-header">
                <h2>Active Checklist</h2>
                <i className="fa-solid fa-list-check" style={{ color: 'var(--gray-400)' }}></i>
              </div>

              <div className="widget-scroll-area custom-scrollbar">
                {/* CURRENT PLAN */}
                <span className="section-label" style={{ marginTop: 0 }}>Current Plan</span>
                <div className="data-card">
                  <div className="card-header-row">
                    <h3 className="card-title">{plan.title}</h3>
                    <span className="badge badge-primary">{daysLeft} days remaining</span>
                  </div>

                  <div className="progress-group">
                    <div className="progress-label-row">
                      <span>Plan Duration</span>
                      <span style={{ color: 'var(--gray-500)' }}>Week {plan.week_number} of {plan.total_weeks}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill fill-primary" style={{ width: `${plan.duration_progress_percent}%` }}></div>
                    </div>
                  </div>

                  <div className="progress-group">
                    <div className="progress-label-row">
                      <span>Overall Compliance</span>
                      <span>{overallCompliance}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill fill-primary" style={{ width: `${overallCompliance}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* EXERCISE BREAKDOWN */}
                <span className="section-label">Exercise Breakdown</span>

                {exercises.map(ex => {
                  const needsAttention = ex.session_compliance_percent < 50;
                  return (
                    <div key={ex.tpe_id} className="data-card">
                      <div className="card-header-row">
                        <div>
                          <h3 className="card-title">{ex.exercise_name}</h3>
                          <div className="card-subtitle">{formatFreq(ex.frequency_type)} • {ex.sessions_per_day}x/day • {ex.prescribed_sets} Sets × {ex.prescribed_reps} Reps</div>
                        </div>
                        {needsAttention && <span className="badge badge-danger">ATTENTION</span>}
                      </div>

                      <div className="progress-group">
                        <div className="progress-label-row">
                          <span>Sessions</span>
                          <span>{ex.session_compliance_percent}%</span>
                        </div>
                        <div className="progress-track">
                          <div className={`progress-fill ${getComplianceFill(ex.session_compliance_percent)}`} style={{ width: `${ex.session_compliance_percent}%` }}></div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--gray-200)' }}>
                        <div style={{ flex: 1 }}>
                          <div className="progress-label-row">
                            <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Avg sets</span>
                            <span>{ex.avg_sets_completed.toFixed(1)}/{ex.prescribed_sets}</span>
                          </div>
                          <div className="progress-track">
                            <div className={`progress-fill ${getComplianceFill((ex.avg_sets_completed / ex.prescribed_sets) * 100)}`} style={{ width: `${Math.min((ex.avg_sets_completed / ex.prescribed_sets) * 100, 100)}%` }}></div>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="progress-label-row">
                            <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Avg Pain</span>
                            <span style={{ color: getPainColor(ex.avg_pain) }}>{ex.avg_pain.toFixed(1)}<span style={{ fontSize: '0.65rem', color: 'var(--gray-400)' }}>/10</span></span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill fill-warning" style={{ width: `${(ex.avg_pain / 10) * 100}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>

        {/* ROW 3: Logs/Plans (Left) & Calendar (Right) */}
        <div className="layout-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(350px, 450px)', gap: '2.5rem', width: '100%' }}>

          <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '2.5rem', paddingRight: '0.5rem' }}>
              {/* 3. REPORTED CONCERNS (Dynamic based on selected date) */}
              <section style={{ display: 'flex', flexDirection: 'column', flex: '1 0 auto' }}>
              <span className="section-label">
                Log for {selectedDateStr ? format(new Date(selectedDateStr), 'MMM d, yyyy') : 'Selected Date'}
              </span>

              {Object.keys(groupedLogs).length > 0 ? (
                <div className="accordion-wrapper">
                  {Object.keys(groupedLogs).map((exerciseName, idx) => (
                    <div
                      key={idx}
                      className={`accordion-item ${expandedLogs[exerciseName] ? 'open' : ''}`}
                    >
                      <button
                        className="accordion-header"
                        onClick={() => toggleLogExpand(exerciseName)}
                      >
                        <div className="acc-title">
                          <i className="fa-solid fa-dumbbell" style={{ fontSize: '0.85rem' }}></i>
                          {exerciseName}
                          <span>({groupedLogs[exerciseName].length} Log{groupedLogs[exerciseName].length > 1 ? 's' : ''})</span>
                        </div>
                        <i className="fa-solid fa-chevron-down acc-icon"></i>
                      </button>
                      <div className="accordion-body" style={{ padding: 0 }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="log-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Pain Level</th>
                                <th>Issue Type</th>
                                <th>Comments / Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupedLogs[exerciseName].map((log, logIdx) => (
                                <tr key={logIdx}>
                                  <td style={{ fontWeight: 600 }}>{logIdx + 1}</td>
                                  <td>
                                    {log.pain_level !== null ? (
                                      <span className="pain-pill">
                                        Pain: {log.pain_level}/10
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--gray-400)' }}>—</span>
                                    )}
                                  </td>
                                  <td>
                                    {log.issue_type ? (
                                      <span className="tag-secondary">{log.issue_type}</span>
                                    ) : (
                                      <span style={{ color: 'var(--gray-400)' }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                                    {log.comments ? (
                                      <span>{log.comments}</span>
                                    ) : (
                                      <span style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>No notes provided.</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fa-regular fa-calendar-check" style={{ fontSize: '2rem', opacity: 0.5, animation: 'none' }}></i>
                  No issues or specific pain logs reported on this date.
                </div>
              )}
            </section>

            </div>
          </main>

          <aside className="right-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 2. SESSION HISTORY (Calendar) */}
            <section style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="section-label">Session History</span>
              <div className="data-card" style={{ flex: 1, padding: '1.5rem' }}>
                <div className="calendar-header">
                  <i className="fa-solid fa-chevron-left" onClick={handlePrevMonth}></i>
                  <span>{format(currentMonth, 'MMMM yyyy')}</span>
                  <i className="fa-solid fa-chevron-right" onClick={handleNextMonth}></i>
                </div>

                <div className="calendar-grid">
                  <div className="cal-day-name">S</div><div className="cal-day-name">M</div><div className="cal-day-name">T</div>
                  <div className="cal-day-name">W</div><div className="cal-day-name">T</div><div className="cal-day-name">F</div><div className="cal-day-name">S</div>

                  {calendarDays.map((day, i) => {
                    if (day.empty) return <div key={`empty-${i}`} className="cal-date empty"></div>;

                    const isActive = selectedDateStr === day.dateStr;
                    const classes = ['cal-date'];
                    if (day.isFuture) classes.push('future');
                    if (isActive) classes.push('active');
                    if (day.dotType === 'rest' && !day.isFuture) classes.push('muted');

                    return (
                      <div
                        key={day.dateStr}
                        className={classes.join(' ')}
                        onClick={() => !day.isFuture && setSelectedDateStr(day.dateStr)}
                      >
                        {day.date}
                        {day.dotType !== 'rest' && day.dotType !== 'future' && (
                          <div className={`dot ${day.dotType}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="calendar-legend">
                  <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--success-color)' }}></div> Complete</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--warning-color)' }}></div> Partial</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--danger-color)' }}></div> Missed</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: 'transparent', border: '1px solid var(--gray-400)' }}></div> Rest</div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
