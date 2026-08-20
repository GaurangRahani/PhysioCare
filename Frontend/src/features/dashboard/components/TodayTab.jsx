import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import ReportConcernModal from './ReportConcernModal';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const formatDate = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

const estimateDuration = (exercises = []) => {
  let s = 0;
  for (const ex of exercises) {
    s += (ex.prescribed_sets || 3) * ((ex.prescribed_reps || 10) * 3 + 25);
  }
  return Math.max(5, Math.round(s / 60));
};

const BODY_COLORS = {
  knee: 'badge-primary', leg: 'badge-primary', 
  shoulder: 'badge-success', arm: 'badge-success',
  back: 'badge-primary', spine: 'badge-primary', 
  hip: 'badge-primary', ankle: 'badge-primary',
  wrist: 'badge-primary', neck: 'badge-primary', 
  elbow: 'badge-primary', core: 'badge-primary',
  foot: 'badge-primary', hand: 'badge-primary', quad: 'badge-primary',
};
const getBadgeClass = (part) => {
  if (!part) return 'badge-primary';
  const lp = part.toLowerCase();
  for (const [k, v] of Object.entries(BODY_COLORS)) { if (lp.includes(k)) return v; }
  return 'badge-primary';
};

const THEMES = {
  morning: { icon: '🌅', colorClass: 'card-orange' },
  evening: { icon: '🌙', colorClass: 'card-purple' },
  daily:   { icon: '⚡', colorClass: 'card-primary' },
  s1:      { icon: '💪', colorClass: 'card-primary' },
  s2:      { icon: '🔥', colorClass: 'card-purple' },
  s3:      { icon: '🌟', colorClass: 'card-orange' },
};
const getTheme = (label, num) => {
  const l = (label || '').toLowerCase();
  if (l.includes('morning')) return THEMES.morning;
  if (l.includes('evening')) return THEMES.evening;
  if (l.includes('daily'))   return THEMES.daily;
  return THEMES[['s1','s2','s3'][(num - 1) % 3]] || THEMES.s1;
};

/* ── Confetti ── */
const CF_COLORS = ['#565acf','#f17732','#209f84','#fe970e','#f72b50','#2754e6','#1f2278'];
const Confetti = () => (
  <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',zIndex:50}} aria-hidden="true">
    <style>{`@keyframes pcfal { 0%{transform:translateY(-8px) rotate(0);opacity:1} 100%{transform:translateY(300px) rotate(540deg);opacity:0} }`}</style>
    {Array.from({ length: 30 }, (_, i) => (
      <div key={i} style={{
        position: 'absolute',
        backgroundColor: CF_COLORS[i % CF_COLORS.length],
        left: `${Math.round((i / 30) * 96) + 2}%`,
        top: '-10px',
        width:  `${6 + (i % 3) * 2}px`,
        height: `${6 + (i % 3) * 2}px`,
        borderRadius: i % 2 === 0 ? '50%' : '2px',
        animation: `pcfal ${(1.2 + (i % 4) * 0.2).toFixed(2)}s linear forwards`,
        animationDelay: `${(i * 0.08).toFixed(2)}s`,
      }} />
    ))}
  </div>
);

const ExerciseItem = ({ ex }) => {
  const done = ex.schedule_status === 'completed';
  return (
    <li className={`exercise-item ${done ? 'completed' : ''}`}>
        <div className="checkbox"></div>
        <div className="exercise-info">
            <h5>{ex.exercise_name}</h5>
            <div className="exercise-meta">
                {(ex.prescribed_sets || ex.prescribed_reps) ? (
                   <>{ex.prescribed_sets || '—'} sets × {ex.prescribed_reps || '—'} reps</>
                ) : null} 
                {ex.target_body_part && (
                    <span className={`badge ${getBadgeClass(ex.target_body_part)}`}>
                        {ex.target_body_part}
                    </span>
                )}
            </div>
        </div>
    </li>
  );
};

const SessionCard = ({ session, planId }) => {
  const navigate = useNavigate();
  const t = getTheme(session.label, session.session_number);
  const allDone = session.completed_count === session.total_count && session.total_count > 0;
  const anyDone = session.completed_count > 0;
  const pct = session.total_count > 0 ? Math.round((session.completed_count / session.total_count) * 100) : 0;
  const dur  = estimateDuration(session.exercises);

  return (
    <div className={`session-card ${t.colorClass}`}>
        <div className="card-header">
            <div className="card-header-title">
                <div className="icon-box">{t.icon}</div>
                <h4>{session.label}</h4>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-body)', fontWeight: 600 }}>
                {session.completed_count}/{session.total_count} ({pct}%)
            </span>
        </div>
        <div className="card-body">
            <ul className="exercise-list">
                {session.exercises.map((ex, i) => <ExerciseItem key={ex.schedule_id || i} ex={ex} />)}
            </ul>
        </div>
        <div className="card-footer" style={{ marginTop: 'auto' }}>
            <div className="session-meta">
                <span>⏱ ~{dur} min</span>
                <span>{session.total_count} exercise{session.total_count !== 1 ? 's' : ''}</span>
            </div>
            {allDone ? (
                <button className="btn" disabled style={{ borderColor: 'var(--success)', color: 'var(--success)' }}>
                    Session Complete ✓
                </button>
            ) : (
                <button
                    className={`btn ${anyDone ? 'btn-filled' : ''}`}
                    onClick={() => navigate(`/dashboard/session/${planId}/${session.session_number}`)}
                >
                    {anyDone ? 'Continue Session →' : 'Start Session'}
                </button>
            )}
        </div>
    </div>
  );
};

const TodayTab = ({ patientId, onBookAppointment }) => {
  const { getToken }        = useAuth();
  const { user: clerkUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [data,    setData]    = useState(null);
  const [concern, setConcern] = useState(false);
  
  const firstName = clerkUser?.firstName || 'Guest';
  const [barW, setBarW] = useState(0);

  useEffect(() => { if (patientId) load(); }, [patientId, getToken]);
  
  useEffect(() => {
    if (data?.weeklyCompliance) {
      const t = setTimeout(() => setBarW(data.weeklyCompliance.percent || 0), 100);
      return () => clearTimeout(t);
    }
  }, [data]);

  const load = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${patientId}/today`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to fetch schedule');
      setData(await res.json());
      setError(null);
    } catch (e) { setError(e.message); }
    finally    { setLoading(false); }
  };

  if (loading) return (
    <div>
      <div className="pc-skel" style={{ height: 120, marginBottom: '20px' }} />
      <div className="pc-skel" style={{ height: 100, marginBottom: '40px' }} />
      <div className="sessions-grid">
        {[1, 2].map(i => <div key={i} className="pc-skel" style={{ height: 350 }} />)}
      </div>
    </div>
  );

  if (error) return (
    <div>
      <div className="pc-empty" style={{ borderColor: 'var(--danger)', padding: '3rem 2rem', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--danger)' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '10px' }}>⚠️ Something went wrong</h2>
        <p style={{ marginBottom: '20px' }}>{error}</p>
        <button className="btn btn-filled" style={{ width: 'auto', padding: '10px 30px' }} onClick={load}>Try Again</button>
      </div>
    </div>
  );

  if (!data?.hasPlan) return (
    <div>
      <div className="pc-empty" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--gray-100)' }}>
        <h2 style={{ marginBottom: '10px' }}>📋 No Active Treatment Plan</h2>
        <p style={{ marginBottom: '20px' }}>Your doctor will assign a personalised treatment plan after your first consultation.</p>
        <button className="btn btn-filled" style={{ width: 'auto', padding: '10px 30px' }} onClick={onBookAppointment}>Book an Appointment</button>
      </div>
    </div>
  );

  const plan = data.plan;
  const sessions = data.sessions || [];
  const pct = data.weeklyCompliance?.percent || 0;
  
  const totalEx  = sessions.reduce((a, s) => a + s.total_count, 0);
  const totalMin = sessions.reduce((a, s) => a + estimateDuration(s.exercises), 0);
  const doneS    = sessions.filter(s => s.completed_count === s.total_count && s.total_count > 0).length;

  const allDone = sessions.length > 0 && sessions.every(s => s.completed_count === s.total_count && s.total_count > 0);

  return (
    <>
      {/* Schedule Header Card */}
      <div className="dashboard-header">
          <div className="schedule-card">
              <div className="schedule-info">
                  <span>{getGreeting()}, {firstName} • {formatDate()}</span>
                  <h2>Your Schedule</h2>
                  {plan?.title && (
                      <div className="tag">
                          📄 {plan.title}
                      </div>
                  )}
              </div>
              {plan?.weekNumber && (
                  <div className="week-tracker">
                      <p>Week</p>
                      <h3>{plan.weekNumber} <span>/ {plan.totalWeeks}</span></h3>
                  </div>
              )}
          </div>

          {/* Progress Section */}
          <div className="progress-section">
              <div className="progress-header">
                  <span>Today's Progress</span>
                  <span className="percent">{pct}%</span>
              </div>
              <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${barW}%` }}></div>
              </div>
              <div className="progress-stats">
                  <div>🏋️ {totalEx} Exercise{totalEx !== 1 ? 's' : ''} Today</div>
                  <div>⏱️ ~{totalMin} min</div>
                  <div>✅ {doneS}/{sessions.length} Sessions Done</div>
              </div>
          </div>
      </div>
      
      {data.isRestDay ? (
          <div className="pc-empty" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--success)' }}>
            <h2 style={{ marginBottom: '10px' }}>🛌 Rest Day</h2>
            <p style={{ marginBottom: '20px' }}>Recovery is just as important as exercise. Rest well today.</p>
            {data.nextSessionDate && (
              <p style={{ fontWeight: 600 }}>
                Next session: <strong style={{ color: 'var(--dark-brand)' }}>
                  {new Date(data.nextSessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </strong>
              </p>
            )}
          </div>
      ) : allDone ? (
          <div className="pc-empty" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--success)', position: 'relative' }}>
            <Confetti />
            <h1 style={{ fontSize: '4rem', marginBottom: '10px', marginTop: 0 }}>🏆</h1>
            <h2 style={{ marginBottom: '10px' }}>All Done for Today!</h2>
            <p style={{ marginBottom: '25px' }}>You completed {sessions.length} session{sessions.length !== 1 ? 's' : ''}. Great job staying on track!</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button className="btn btn-filled" style={{ width: 'auto', padding: '10px 30px' }} onClick={() => useNavigate()('/dashboard/progress')}>View Progress</button>
            </div>
          </div>
      ) : (
          <div>
              <h3 className="section-title">Today's Sessions</h3>
              <div className="sessions-grid">
                  {sessions.map((s, i) => (
                      <SessionCard key={s.session_number} session={s} planId={plan.id} />
                  ))}
              </div>
          </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button 
            onClick={() => setConcern(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-body)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Report a Concern
          </button>
      </div>
      <ReportConcernModal isOpen={concern} onClose={() => setConcern(false)} patientId={patientId} />
    </>
  );
};

export default TodayTab;
