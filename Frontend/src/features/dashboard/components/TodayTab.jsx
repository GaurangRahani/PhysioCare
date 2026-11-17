import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Dumbbell, 
  Sparkles, 
  AlertCircle, 
  Calendar, 
  ChevronRight,
  Trophy,
  Moon,
  Sun,
  Flame
} from 'lucide-react';
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

const getThemeIcon = (label = '', num = 1) => {
  const l = label.toLowerCase();
  if (l.includes('morning')) return <Sun size={16} className="text-[#F59E0B]" />;
  if (l.includes('evening') || l.includes('night')) return <Moon size={16} className="text-[#8B5CF6]" />;
  if (l.includes('cardio') || l.includes('strength')) return <Flame size={16} className="text-[#EF4444]" />;
  return <Dumbbell size={16} className="text-[#0080FF]" />;
};

/* ── Confetti ── */
const CF_COLORS = ['#0080FF', '#10B981', '#F59E0B', '#8B5CF6', '#111111'];
const Confetti = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-20" aria-hidden="true">
    <style>{`@keyframes pcfal { 0%{transform:translateY(-8px) rotate(0);opacity:1} 100%{transform:translateY(280px) rotate(540deg);opacity:0} }`}</style>
    {Array.from({ length: 24 }, (_, i) => (
      <div 
        key={i} 
        style={{
          position: 'absolute',
          backgroundColor: CF_COLORS[i % CF_COLORS.length],
          left: `${Math.round((i / 24) * 96) + 2}%`,
          top: '-10px',
          width: `${6 + (i % 3) * 2}px`,
          height: `${6 + (i % 3) * 2}px`,
          borderRadius: i % 2 === 0 ? '50%' : '2px',
          animation: `pcfal ${(1.2 + (i % 4) * 0.2).toFixed(2)}s linear forwards`,
          animationDelay: `${(i * 0.08).toFixed(2)}s`,
        }} 
      />
    ))}
  </div>
);

const ExerciseItem = ({ ex }) => {
  const done = ex.schedule_status === 'completed';
  return (
    <li className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${done ? 'bg-[#FAFAFA]' : 'hover:bg-[#F9F9F9]'}`}>
      <div className="mt-0.5 shrink-0">
        {done ? (
          <CheckCircle2 size={16} className="text-[#10B981]" />
        ) : (
          <Circle size={16} className="text-[#CCCCCC]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-[13px] font-medium block truncate ${done ? 'line-through text-[#8A8A8A]' : 'text-[#202223]'}`}>
          {ex.exercise_name}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#616161] mt-0.5">
          {(ex.prescribed_sets || ex.prescribed_reps) && (
            <span className="font-mono">
              {ex.prescribed_sets || '—'} sets × {ex.prescribed_reps || '—'} reps
            </span>
          )}
          {ex.target_body_part && (
            <span className="px-1.5 py-0.2 rounded bg-[#F0F0F0] text-[#616161] text-[10px] font-medium capitalize">
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
  const allDone = session.completed_count === session.total_count && session.total_count > 0;
  const anyDone = session.completed_count > 0;
  const pct = session.total_count > 0 ? Math.round((session.completed_count / session.total_count) * 100) : 0;
  const dur = estimateDuration(session.exercises);

  return (
    <div className="saas-card bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[#D1D1D1] transition-all">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0] mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] flex items-center justify-center shrink-0">
              {getThemeIcon(session.label, session.session_number)}
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-[#202223] m-0">
                {session.label}
              </h4>
              <span className="text-[11px] text-[#8A8A8A]">
                Session {session.session_number}
              </span>
            </div>
          </div>

          <span className={`text-[12px] font-mono font-semibold px-2 py-0.5 rounded-full ${
            allDone ? 'bg-[#D9F7C3] text-[#245B19]' : 'bg-[#F5F5F5] text-[#616161]'
          }`}>
            {session.completed_count}/{session.total_count} ({pct}%)
          </span>
        </div>

        {/* Exercises List */}
        <ul className="flex flex-col gap-1 mb-4">
          {session.exercises.map((ex, i) => (
            <ExerciseItem key={ex.schedule_id || i} ex={ex} />
          ))}
        </ul>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-[#F0F0F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-auto">
        <div className="flex items-center gap-3 text-[11px] text-[#8A8A8A]">
          <span className="flex items-center gap-1 font-mono">
            <Clock size={12} />
            <span>~{dur} min</span>
          </span>
          <span>•</span>
          <span>{session.total_count} exercise{session.total_count !== 1 ? 's' : ''}</span>
        </div>

        {allDone ? (
          <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D9F7C3] text-[#245B19] text-[12px] font-medium">
            <CheckCircle2 size={13} />
            <span>Completed</span>
          </div>
        ) : (
          <button
            type="button"
            className="btn-primary-saas text-[12px] py-1.5 px-4 flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
            onClick={() => navigate(`/dashboard/session/${planId}/${session.session_number}`)}
          >
            <span>{anyDone ? 'Continue Session' : 'Start Session'}</span>
            <ChevronRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

const TodayTab = ({ patientId, onBookAppointment }) => {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [concern, setConcern] = useState(false);
  const [barW, setBarW] = useState(0);

  const firstName = clerkUser?.firstName || 'Patient';

  useEffect(() => {
    if (patientId) load();
  }, [patientId, getToken]);

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
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-28 bg-[#F5F5F5] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-[#F5F5F5] rounded-2xl animate-pulse" />
          <div className="h-64 bg-[#F5F5F5] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-[#FFFFFF] border border-[#FCE4E4] rounded-2xl">
        <AlertCircle size={28} className="text-[#B42318] mx-auto mb-2" />
        <h3 className="text-[15px] font-semibold text-[#202223] mb-1">Unable to Load Schedule</h3>
        <p className="text-[13px] text-[#616161] mb-4">{error}</p>
        <button 
          onClick={load}
          className="btn-secondary-saas text-[12px] py-1.5 px-4 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data?.hasPlan) {
    return (
      <div className="p-8 text-center bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl">
        <Calendar size={28} className="text-[#8A8A8A] mx-auto mb-2" />
        <h3 className="text-[16px] font-semibold text-[#202223] mb-1">No Active Treatment Plan</h3>
        <p className="text-[13px] text-[#616161] max-w-md mx-auto mb-5 leading-relaxed">
          Your doctor will assign a personalized physiotherapy plan following your initial clinical evaluation.
        </p>
        <button 
          onClick={onBookAppointment}
          className="btn-primary-saas text-[12px] py-2 px-5 cursor-pointer"
        >
          Book Consultation
        </button>
      </div>
    );
  }

  const plan = data.plan;
  const sessions = data.sessions || [];
  const pct = data.weeklyCompliance?.percent || 0;
  const totalEx = sessions.reduce((a, s) => a + s.total_count, 0);
  const totalMin = sessions.reduce((a, s) => a + estimateDuration(s.exercises), 0);
  const doneS = sessions.filter(s => s.completed_count === s.total_count && s.total_count > 0).length;
  const allDone = sessions.length > 0 && sessions.every(s => s.completed_count === s.total_count && s.total_count > 0);

  return (
    <div className="flex flex-col gap-6">
      
      {/* ── Today's Progress Bar Card (Shopify Aesthetic) ──────────────── */}
      <div className="saas-card bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] block">
              Today's Routine Progress
            </span>
            <h3 className="text-[16px] font-semibold text-[#202223] m-0">
              {plan?.title || 'Personalized Recovery Protocol'}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {plan?.weekNumber && (
              <div className="text-[11px] px-2.5 py-1 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] font-mono text-[#616161]">
                Week <strong className="text-[#202223]">{plan.weekNumber}</strong> / {plan.totalWeeks}
              </div>
            )}
            <span className="text-[15px] font-bold font-mono text-[#202223]">
              {pct}%
            </span>
          </div>
        </div>

        {/* Progress Fill Bar */}
        <div className="w-full h-2 rounded-full bg-[#F0F0F0] overflow-hidden mb-3">
          <div 
            className="h-full bg-[#10B981] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${barW}%` }}
          />
        </div>

        {/* Stats Strip */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[12px] text-[#616161]">
          <div className="flex items-center gap-1.5">
            <Dumbbell size={13} className="text-[#8A8A8A]" />
            <span>{totalEx} Exercise{totalEx !== 1 ? 's' : ''} Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-[#8A8A8A]" />
            <span>~{totalMin} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-[#10B981]" />
            <span>{doneS}/{sessions.length} Sessions Done</span>
          </div>
        </div>
      </div>

      {/* ── Sessions Content ───────────────────────────────────────────── */}
      {data.isRestDay ? (
        <div className="p-8 text-center bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl shadow-xs">
          <span className="text-3xl mb-2 block">🛌</span>
          <h3 className="text-[16px] font-semibold text-[#202223] mb-1">Rest & Recovery Day</h3>
          <p className="text-[13px] text-[#616161] max-w-sm mx-auto mb-3">
            Tissue adaptation and muscle recovery occur during rest. Stay hydrated today.
          </p>
          {data.nextSessionDate && (
            <span className="text-[12px] font-mono text-[#8A8A8A]">
              Next session scheduled for: {new Date(data.nextSessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      ) : allDone ? (
        <div className="p-8 text-center bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl shadow-xs relative overflow-hidden">
          <Confetti />
          <div className="w-12 h-12 rounded-2xl bg-[#D9F7C3] text-[#245B19] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Trophy size={24} />
          </div>
          <h3 className="text-[18px] font-semibold text-[#202223] mb-1">All Done for Today!</h3>
          <p className="text-[13px] text-[#616161] max-w-sm mx-auto mb-5">
            You completed {sessions.length} session{sessions.length !== 1 ? 's' : ''}. Great work staying consistent with your recovery.
          </p>
          <button 
            type="button"
            onClick={() => navigate('/dashboard/progress')}
            className="btn-primary-saas text-[12px] py-2 px-5 cursor-pointer mx-auto"
          >
            View Recovery Progress
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#202223] m-0">
              Today's Sessions
            </h3>
            <span className="text-[11px] font-mono text-[#8A8A8A]">
              {sessions.length} sessions available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {sessions.map((s) => (
              <SessionCard key={s.session_number} session={s} planId={plan.id} />
            ))}
          </div>
        </div>
      )}

      {/* ── Report Concern Action ──────────────────────────────────────── */}
      <div className="text-center pt-2">
        <button 
          type="button"
          onClick={() => setConcern(true)}
          className="text-[12px] text-[#8A8A8A] hover:text-[#202223] hover:underline cursor-pointer transition-colors"
        >
          Having increased pain or discomfort? Report a clinical concern
        </button>
      </div>

      <ReportConcernModal 
        isOpen={concern} 
        onClose={() => setConcern(false)} 
        patientId={patientId} 
      />

    </div>
  );
};

export default TodayTab;
