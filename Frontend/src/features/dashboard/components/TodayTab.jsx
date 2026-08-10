import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import ReportConcernModal from './ReportConcernModal';

const todayTabStyles = `
/* =========================================================
   INJECTED COLOR SESSION CARD UI
   ========================================================= */
.session-card {
    background: var(--body-bg);
    border: 1px solid var(--gray-200);
    border-radius: 16px;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 4px 20px rgba(86, 90, 207, 0.05);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.session-card:hover {
    transform: translateY(-5px);
    border-color: var(--primary-color);
    box-shadow: 0 15px 35px rgba(86, 90, 207, 0.15);
}

.session-header {
    background: rgba(86, 90, 207, 0.15);
    display: flex; 
    justify-content: space-between; 
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(86, 90, 207, 0.15);
}

.session-card.completed-card .session-header {
    background: rgba(32, 159, 132, 0.15);
    border-bottom-color: rgba(32, 159, 132, 0.2);
}

.session-title-group h2 { 
    font-size: 1.25rem; 
    color: var(--dark-brand-color); 
    margin-bottom: 0.25rem; 
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
}

.session-card .badge {
    background: var(--body-bg);
    color: var(--primary-color);
    padding: 0.25rem 0.75rem;
    border-radius: 50px; 
    font-size: 0.75rem; 
    font-weight: 700; 
    text-transform: uppercase;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    display: inline-block;
}

.session-card.completed-card .badge {
    color: var(--success);
}

.circular-progress { position: relative; width: 54px; height: 54px; }
.circular-progress svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.circular-progress .progress-bg { fill: none; stroke: rgba(255, 255, 255, 0.6); stroke-width: 4; }
.circular-progress .progress-bar {
    fill: none; stroke: var(--primary-color); stroke-width: 4; stroke-linecap: round;
    stroke-dasharray: 138; transition: stroke-dashoffset 1s ease-in-out;
}
.circular-progress .progress-text {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    font-size: 0.85rem; font-weight: 700; color: var(--dark-brand-color); font-family: 'Poppins', sans-serif;
}

.circular-progress.success .progress-bar { stroke: var(--success); }
.circular-progress.success .progress-text { color: var(--success); }

.session-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    flex: 1;
}

.session-card .exercise-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; flex: 1; }

.session-card .exercise-item {
    display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem;
    background: #f8f9fa; border-radius: 8px; font-size: 0.95rem; font-weight: 600;
    transition: all 0.15s ease-in-out; border: 1px solid transparent;
}
.session-card .exercise-item:hover { background: var(--body-bg); border-color: rgba(86, 90, 207, 0.15); box-shadow: 0 4px 10px rgba(86, 90, 207, 0.05); }
.session-card .exercise-item i { font-size: 1.2rem; }

.session-card .exercise-item.completed { color: var(--gray-500); text-decoration: line-through; }
.session-card .exercise-item.completed i { color: var(--success); }
.session-card .exercise-item.pending { color: var(--heading-text-color); }
.session-card .exercise-item.pending i { color: var(--gray-400); }

.session-card .btn-action {
    width: 100%; display: flex; justify-content: space-between; align-items: center;
    background: var(--primary-color); color: white; padding: 1rem 1.5rem;
    border-radius: 8px; font-size: 1rem; font-weight: 600; margin-top: auto;
    box-shadow: 0 4px 10px rgba(86, 90, 207, 0.2); border: none; cursor: pointer;
    transition: all 0.2s ease-in-out;
}
.session-card .btn-action i { transition: transform 0.2s ease-in-out; }
.session-card .btn-action:hover { background: var(--dark-brand-color); box-shadow: 0 6px 15px rgba(31, 34, 120, 0.25); }
.session-card .btn-action:hover i { transform: translateX(5px); }

.session-card .btn-start { background: var(--body-bg); border: 1px solid var(--primary-color); color: var(--primary-color); box-shadow: none; }
.session-card .btn-start:hover { background: rgba(86, 90, 207, 0.15); color: var(--primary-color); }

.session-card .btn-completed { background: rgba(32, 159, 132, 0.15); color: var(--success); pointer-events: none; box-shadow: none; }
`;

const SessionCard = ({ session, planId }) => {
  const navigate = useNavigate();

  const allDone = session.completed_count === session.total_count;
  const anyDone = session.completed_count > 0;
  const pct = session.total_count > 0 ? (session.completed_count / session.total_count) * 100 : 0;

  const handleAction = () => {
    if (allDone) return;
    navigate(`/dashboard/session/${planId}/${session.session_number}`);
  };

  const isNext = !allDone && (anyDone || session.session_number === 1);

  const circumference = 138;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <>
      <style>{todayTabStyles}</style>
      <div className={`session-card ${allDone ? 'completed-card' : ''}`}>
        <div className="session-header">
            <div className="session-title-group">
                <h2>{session.label}</h2>
                <span className="badge">{session.total_count} {session.total_count === 1 ? 'Exercise' : 'Exercises'}</span>
            </div>
            <div className={`circular-progress ${allDone ? 'success' : ''}`}>
                <svg viewBox="0 0 54 54">
                    <circle className="progress-bg" cx="27" cy="27" r="22"></circle>
                    <circle className="progress-bar" cx="27" cy="27" r="22" style={{ strokeDashoffset: offset }}></circle>
                </svg>
                <span className="progress-text">
                    {allDone ? <i className="fa-solid fa-check"></i> : `${Math.round(pct)}%`}
                </span>
            </div>
        </div>

        <div className="session-body">
            <div className="exercise-list">
                {session.exercises.map((ex, idx) => {
                    const done = ex.schedule_status === 'completed';
                    return (
                        <div key={idx} className={`exercise-item ${done ? 'completed' : 'pending'}`}>
                            {done ? <i className="fa-solid fa-circle-check"></i> : <i className="fa-regular fa-circle"></i>}
                            {ex.exercise_name}
                        </div>
                    );
                })}
            </div>

            {allDone ? (
                <button className="btn-action btn-completed" disabled>
                    Session Completed <i className="fa-solid fa-check-double"></i>
                </button>
            ) : (
                <button 
                    onClick={handleAction} 
                    className={`btn-action ${anyDone ? '' : 'btn-start'}`}
                >
                    {anyDone ? 'Continue Session' : 'Start Session'} 
                    <i className="fa-solid fa-arrow-right"></i>
                </button>
            )}
        </div>
      </div>
    </>
  );
};

/* ── Main TodayTab ───────────────────────────────────────────────────────────── */
const TodayTab = ({ patientId, onBookAppointment }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [isConcernModalOpen, setIsConcernModalOpen] = useState(false);

  useEffect(() => {
    if (patientId) fetchTodayData();
  }, [patientId, getToken]);

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${patientId}/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch schedule');
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading ─────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        {[1, 2].map((i) => (
          <div key={i} style={{ height: '160px', background: 'var(--gray-200)', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', background: '#fff5f5', borderRadius: '12px', border: '1px solid #fed7d7', textAlign: 'center', color: 'var(--danger)', fontWeight: 600, marginTop: '2rem' }}>
        {error}
        <button onClick={fetchTodayData} style={{ display: 'block', margin: '1rem auto 0', padding: '0.4rem 1rem', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          Retry
        </button>
      </div>
    );
  }

  /* ── No plan ──────────────────────────────────────────────────────────────── */
  if (!data?.hasPlan) {
    return (
      <div className="dash-card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ background: 'var(--gray-150)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="var(--gray-400)" viewBox="0 0 16 16">
            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: 'var(--heading-text-color)', marginBottom: '0.75rem' }}>No Active Plan</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '2rem', maxWidth: '320px' }}>No treatment plan assigned yet. Your doctor will create one after your consultation.</p>
        <button className="btn-themed primary" onClick={onBookAppointment}>Book an Appointment</button>
      </div>
    );
  }

  /* ── Rest day ─────────────────────────────────────────────────────────────── */
  if (data.isRestDay) {
    return (
      <div className="dash-card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '2rem' }}>
        <div style={{ background: 'rgba(32, 159, 132, 0.15)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="var(--success)" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: 'var(--heading-text-color)', marginBottom: '0.5rem' }}>Rest day today. 💪</h2>
        {data.nextSessionDate && (
          <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
            Your next session is on{' '}
            <strong style={{ color: 'var(--heading-text-color)' }}>
              {new Date(data.nextSessionDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </strong>.
          </p>
        )}
      </div>
    );
  }

  /* ── Sessions list ────────────────────────────────────────────────────────── */
  return (
    <div>
      <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '1.25rem' }}>
        Today's Sessions
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {data.sessions.map((session) => (
          <SessionCard key={session.session_number} session={session} planId={data.plan.id} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '4rem', position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => setIsConcernModalOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-600)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s ease-in-out' }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--warning)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--gray-600)'}
        >
          [+ Report a Concern]
        </button>
      </div>

      <ReportConcernModal
        isOpen={isConcernModalOpen}
        onClose={() => setIsConcernModalOpen(false)}
        patientId={patientId}
      />
    </div>
  );
};

export default TodayTab;
