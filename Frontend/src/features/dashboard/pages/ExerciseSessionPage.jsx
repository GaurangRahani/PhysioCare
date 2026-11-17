import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  ChevronLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Dumbbell, 
  Clock, 
  Stethoscope, 
  ChevronRight, 
  Check, 
  X, 
  Phone,
  ArrowRight
} from 'lucide-react';
import ExerciseMediaCarousel from '../components/ExerciseMediaCarousel';
import ReportConcernModal from '../components/ReportConcernModal';

const ExerciseSessionPage = () => {
  const { planId, sessionNumber } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Form State
  const [setsCompleted, setSetsCompleted] = useState(null);
  const [painLevel, setPainLevel] = useState(0);
  const [comments, setComments] = useState('');
  const [selectedConcern, setSelectedConcern] = useState(null);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHighPainModal, setShowHighPainModal] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [shakeChips, setShakeChips] = useState(false);
  const [patientId, setPatientId] = useState(null);
  const [isConcernModalOpen, setIsConcernModalOpen] = useState(false);

  useEffect(() => {
    fetchSessionData();
  }, [planId, sessionNumber]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const profileRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error("Failed to get profile");
      const profileData = await profileRes.json();
      const fetchedPatientId = profileData.user.id;
      setPatientId(fetchedPatientId);

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${fetchedPatientId}/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to get schedule");
      const data = await res.json();

      if (data && data.sessions) {
        const session = data.sessions.find(s => s.session_number === parseInt(sessionNumber));
        if (session && session.exercises) {
          setExercises(session.exercises);
          const firstPendingIndex = session.exercises.findIndex(e => e.schedule_status !== 'completed');
          setCurrentIndex(firstPendingIndex >= 0 ? firstPendingIndex : 0);
        }
      }
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const hasUnsavedInput = setsCompleted !== null || painLevel > 0 || comments.length > 0;
    if (hasUnsavedInput) {
      if (window.confirm("Leave this exercise? Any unsaved progress will be lost.")) {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const currentExercise = exercises[currentIndex];
  const isLastExercise = currentIndex === exercises.length - 1;

  const handleSubmit = async () => {
    if (setsCompleted === null) {
      setShakeChips(true);
      setTimeout(() => setShakeChips(false), 500);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      
      const payload = {
        treatment_plan_exercise_id: currentExercise.treatment_plan_exercise_id,
        log_date: new Date().toLocaleDateString('en-CA'),
        session_number: parseInt(sessionNumber),
        sets_completed: setsCompleted === 99 ? (currentExercise.prescribed_sets || 1) + 1 : setsCompleted,
        pain_level: painLevel,
        comments: comments || null,
        issue_type: selectedConcern || null,
        attachment_urls: [],
        is_skipped: false,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exercise-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok && !data.alreadyLogged) {
        throw new Error(data.message || 'Error saving');
      }

      if (painLevel >= 7) {
        setShowHighPainModal(true);
        return;
      }

      proceedAfterSave();
    } catch (err) {
      console.error(err);
      alert("Couldn't save progress. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipConfirm = async () => {
    setShowSkipConfirm(false);
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const payload = {
        treatment_plan_exercise_id: currentExercise.treatment_plan_exercise_id,
        log_date: new Date().toLocaleDateString('en-CA'),
        session_number: parseInt(sessionNumber),
        sets_completed: 0,
        pain_level: null,
        comments: 'Skipped by user',
        issue_type: null,
        attachment_urls: [],
        is_skipped: true,
      };

      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/exercise-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      proceedAfterSave();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const proceedAfterSave = () => {
    if (isLastExercise) {
      navigate(`/dashboard/session/${planId}/${sessionNumber}/complete`);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSetsCompleted(null);
      setPainLevel(0);
      setComments('');
      setSelectedConcern(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading || !currentExercise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 font-['Inter',system-ui,sans-serif]">
        <div className="w-8 h-8 border-2 border-[#202223] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-[13px] text-[#616161]">Loading exercise protocol...</span>
      </div>
    );
  }

  const prescribedSets = currentExercise.prescribed_sets || 1;
  const chipNumbers = Array.from({ length: prescribedSets }, (_, i) => i + 1);
  const concerns = [
    { id: 'increased_pain', label: 'Increased Pain' },
    { id: 'exercise_difficulty', label: 'Difficulty' },
    { id: 'new_symptom', label: 'New Symptom' },
    { id: 'general_concern', label: 'General Concern' }
  ];

  return (
    <div className="w-full space-y-5 animate-fade-in font-['Inter',system-ui,sans-serif] text-[#202223] pb-28 md:pb-8">
      
      {/* ── 1. TOP SESSION CONTEXT & PROGRESS ───────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleBack} 
              className="p-1 rounded-[6px] text-[#616161] hover:text-[#202223] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
              title="Return to schedule"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-[14px] font-semibold text-[#202223]">
              Session {sessionNumber}
            </span>
            <span className="text-[#8A8A8A] text-[13px]">
              · Exercise {currentIndex + 1} of {exercises.length}
            </span>
          </div>

          <span className="text-[11px] font-mono font-medium text-[#616161] bg-[#F4F4F4] px-2.5 py-0.5 rounded-full">
            {Math.round(((currentIndex) / exercises.length) * 100)}% Complete
          </span>
        </div>

        {/* Progress Fill Bar */}
        <div className="w-full h-1.5 rounded-full bg-[#EAEAEA] overflow-hidden">
          <div 
            className="h-full bg-[#202223] rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ── 2. TWO-COLUMN RESPONSIVE LAYOUT (Mobile Stacks, Tablet/Desktop 2-Col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ── LEFT COLUMN: MEDIA & INSTRUCTIONS (lg:col-span-6) ── */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Video Demonstration Card */}
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] overflow-hidden shadow-xs">
            <div className="aspect-video w-full bg-[#0A0A0A] flex items-center justify-center">
              <ExerciseMediaCarousel 
                videoUrl={currentExercise.video_url} 
                imageUrls={currentExercise.image_urls} 
              />
            </div>
          </div>

          {/* Exercise Instructions & Clinical Details Card */}
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F0F0F0]">
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#202223] leading-tight">
                  {currentExercise.exercise_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#008060]">
                    <Dumbbell size={13} />
                    Prescribed: {prescribedSets} Sets × {currentExercise.prescribed_reps} Reps
                  </span>
                </div>
              </div>

              {currentExercise.target_body_part && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#F4F4F4] text-[#616161] text-[11px] font-medium uppercase tracking-wider shrink-0">
                  {currentExercise.target_body_part}
                </span>
              )}
            </div>

            {/* Instructions */}
            {currentExercise.instructions && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Step-by-Step Instructions
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-[13px] text-[#616161] leading-relaxed">
                  {currentExercise.instructions.split('\n').map((instruction, idx) => (
                    instruction.trim() ? <li key={idx}>{instruction.trim()}</li> : null
                  ))}
                </ol>
              </div>
            )}

            {/* Doctor Note (if present) */}
            {currentExercise.doctor_notes && (
              <div className="p-3 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] space-y-1 mt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] flex items-center gap-1">
                  <Stethoscope size={12} /> Therapist Guidance
                </span>
                <p className="text-[12px] text-[#202223] italic">
                  "{currentExercise.doctor_notes}"
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT COLUMN: LOG PROGRESS & FORM (lg:col-span-6) ── */}
        <div className="lg:col-span-6">
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-4 sm:p-5 shadow-xs space-y-5">
            
            <div className="pb-3 border-b border-[#F0F0F0]">
              <h3 className="text-[15px] font-semibold text-[#202223]">
                Log Your Progress
              </h3>
              <p className="text-[12px] text-[#616161] mt-0.5">
                Record your sets completed and symptom feedback for your therapist.
              </p>
            </div>

            {/* 1. Sets Completed */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
                Sets Completed (Prescribed Goal: {prescribedSets})
              </label>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {chipNumbers.map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSetsCompleted(n)}
                    className={`min-w-[44px] h-[40px] px-3 rounded-[8px] border text-[13px] font-mono font-medium transition-colors cursor-pointer flex items-center justify-center ${
                      setsCompleted === n
                        ? 'bg-[#202223] text-[#FFFFFF] border-[#202223] font-bold shadow-xs'
                        : 'bg-[#FFFFFF] border-[#EAEAEA] text-[#202223] hover:border-[#202223] hover:bg-[#FBFBFB]'
                    }`}
                  >
                    {n}
                  </button>
                ))}

                {prescribedSets >= 3 && (
                  <button
                    type="button"
                    onClick={() => setSetsCompleted(99)}
                    className={`min-w-[50px] h-[40px] px-3 rounded-[8px] border text-[13px] font-medium transition-colors cursor-pointer flex items-center justify-center ${
                      setsCompleted === 99
                        ? 'bg-[#202223] text-[#FFFFFF] border-[#202223] font-bold shadow-xs'
                        : 'bg-[#FFFFFF] border-[#EAEAEA] text-[#202223] hover:border-[#202223] hover:bg-[#FBFBFB]'
                    }`}
                  >
                    More
                  </button>
                )}
              </div>

              {shakeChips && setsCompleted === null && (
                <p className="text-[12px] text-[#B81818] font-medium flex items-center gap-1 animate-pulse">
                  <AlertTriangle size={13} />
                  Please select how many sets you completed before submitting.
                </p>
              )}
            </div>

            {/* 2. Pain Level Slider */}
            <div className="p-3.5 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-[12px] font-medium text-[#202223]">
                  Pain / Discomfort Level
                </label>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  painLevel <= 3 
                    ? 'bg-[#D9F7C3] text-[#245B19]' 
                    : painLevel <= 6 
                    ? 'bg-[#FFF2CC] text-[#8A6116]' 
                    : 'bg-[#FCE4E4] text-[#B81818]'
                }`}>
                  {painLevel}/10
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="10"
                value={painLevel}
                onChange={e => setPainLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-[#EAEAEA] rounded-lg appearance-none cursor-pointer accent-[#202223]"
              />

              <div className="flex justify-between text-[10px] font-mono text-[#8A8A8A]">
                <span>0 — None</span>
                <span>Current: {painLevel}</span>
                <span>10 — Severe</span>
              </div>
            </div>

            {/* 3. Comments Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
                Comments / Mobility Feedback (Optional)
              </label>
              <textarea
                placeholder="How did this movement feel? Any joint tightness or fatigue?"
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={2}
                className="w-full p-2.5 text-[13px] bg-[#FFFFFF] border border-[#EAEAEA] rounded-[10px] text-[#202223] placeholder-[#8A8A8A] outline-none focus:border-[#202223] transition-colors resize-none"
              />
            </div>

            {/* 4. Flag a Concern Buttons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
                Flag a Concern? (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {concerns.map(c => {
                  const isSelected = selectedConcern === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConcern(isSelected ? null : c.id)}
                      className={`py-2 px-2.5 rounded-[8px] border text-left text-[12px] font-medium transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#202223] text-[#FFFFFF] border-[#202223] shadow-xs'
                          : 'bg-[#FFFFFF] border-[#EAEAEA] text-[#616161] hover:border-[#202223] hover:text-[#202223]'
                      }`}
                    >
                      <span className="truncate">{c.label}</span>
                      {isSelected && <Check size={12} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Complete & Action Footer */}
            <div className="pt-3 border-t border-[#F0F0F0] space-y-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-[8px] text-[13px] font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#202020] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Saving progress...</span>
                ) : isLastExercise ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Complete Session</span>
                  </>
                ) : (
                  <>
                    <span>Complete & Next Exercise</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowSkipConfirm(true)}
                  disabled={isSubmitting}
                  className="text-[12px] text-[#8A8A8A] hover:text-[#B81818] hover:underline cursor-pointer transition-colors"
                >
                  Skip this exercise
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── 3. HIGH PAIN DIALOG MODAL ───────────────────────────────────────── */}
      {showHighPainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-['Inter',system-ui,sans-serif]">
          <div className="bg-[#FFFFFF] rounded-[16px] max-w-sm w-full p-6 border border-[#EAEAEA] shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FCE4E4] text-[#B81818] flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-semibold text-[#202223]">
              High Pain Level Reported
            </h3>
            <p className="text-[13px] text-[#616161] leading-relaxed">
              You logged a discomfort level of <strong className="text-[#B81818]">{painLevel}/10</strong>. If this feels acute or sudden, please contact your clinic.
            </p>
            <div className="py-2 text-[14px] font-mono font-bold text-[#202223] flex items-center justify-center gap-1.5">
              <Phone size={14} className="text-[#008060]" />
              <a href="tel:+919876543210" className="hover:underline">+91 98765 43210</a>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowHighPainModal(false);
                  setIsConcernModalOpen(true);
                }}
                className="w-full py-2 px-3 text-[12px] font-semibold text-[#FFFFFF] bg-[#B81818] hover:bg-[#9B1414] rounded-[8px] transition-colors cursor-pointer"
              >
                Report Concern to Doctor
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHighPainModal(false);
                  proceedAfterSave();
                }}
                className="w-full py-2 px-3 text-[12px] font-medium text-[#616161] hover:text-[#202223] hover:bg-[#F4F4F4] rounded-[8px] transition-colors cursor-pointer"
              >
                Acknowledge & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. SKIP CONFIRMATION DIALOG MODAL ───────────────────────────────── */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-['Inter',system-ui,sans-serif]">
          <div className="bg-[#FFFFFF] rounded-[16px] max-w-sm w-full p-6 border border-[#EAEAEA] shadow-2xl text-center space-y-3">
            <h3 className="text-base font-semibold text-[#202223]">
              Skip this exercise?
            </h3>
            <p className="text-[13px] text-[#616161] leading-relaxed">
              Skipping will log this movement as uncompleted. Your physical therapist will review this in your weekly compliance record.
            </p>
            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 py-2 px-3 text-[12px] font-medium text-[#202223] bg-[#F4F4F4] hover:bg-[#EAEAEA] rounded-[8px] transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleSkipConfirm}
                className="flex-1 py-2 px-3 text-[12px] font-semibold text-[#FFFFFF] bg-[#B81818] hover:bg-[#9B1414] rounded-[8px] transition-colors cursor-pointer"
              >
                Skip Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. REPORT CONCERN MODAL ─────────────────────────────────────────── */}
      <ReportConcernModal
        isOpen={isConcernModalOpen}
        onClose={() => {
          setIsConcernModalOpen(false);
          proceedAfterSave();
        }}
        prefilledIssueType="increased_pain"
        patientId={patientId}
      />

    </div>
  );
};

export default ExerciseSessionPage;
