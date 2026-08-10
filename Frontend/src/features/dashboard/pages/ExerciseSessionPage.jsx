import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import ExerciseMediaCarousel from '../components/ExerciseMediaCarousel';
import ReportConcernModal from '../components/ReportConcernModal';
import './ExerciseSessionPage.css';

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
  
  // High Pain Modal handling flag
  const [pendingPainNavigation, setPendingPainNavigation] = useState(false);

  useEffect(() => {
    fetchSessionData();
  }, [planId, sessionNumber]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // First get user profile to find patientId
      const profileRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error("Failed to get profile");
      const profileData = await profileRes.json();
      const fetchedPatientId = profileData.user.id;
      setPatientId(fetchedPatientId);

      // Now fetch today's schedule
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${fetchedPatientId}/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to get schedule");
      const data = await res.json();

      if (data && data.sessions) {
        const session = data.sessions.find(s => s.session_number === parseInt(sessionNumber));
        if (session && session.exercises) {
          setExercises(session.exercises);
          // Find first pending exercise to resume
          const firstPendingIndex = session.exercises.findIndex(e => e.schedule_status !== 'completed');
          setCurrentIndex(firstPendingIndex >= 0 ? firstPendingIndex : 0);
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback redirect if error
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getPainLabel = (v) => {
    if (v === 0) return "0 — None";
    if (v <= 2) return `${v} — Very Mild`;
    if (v <= 4) return `${v} — Mild`;
    if (v <= 6) return `${v} — Moderate`;
    if (v <= 8) return `${v} — Severe`;
    return `${v} — Very Severe`;
  };

  const getPainColor = (v) => {
    if (v <= 3) return 'text-green-600';
    if (v <= 6) return 'text-amber-600';
    return 'text-red-600';
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
        return; // Wait for modal dismissal
      }

      proceedAfterSave();

    } catch (err) {
      console.error(err);
      alert("Couldn't save. Please try again.");
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
      <div className="session-page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--primary-color)', width: '48px', height: '48px', borderWidth: '4px' }}></div>
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
    <div className="session-page-wrapper">
      <svg className="theme-wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="rgba(86, 90, 207, 0.05)" fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
      </svg>

      <div className="shape shape-circle"></div>
      <div className="shape shape-plus"></div>
      
      {/* Top Bar (Sticky) */}
      <div className="session-top-bar">
        <div className="top-bar-content">
          <button onClick={handleBack} className="btn-back">
            <ChevronLeft size={24} />
          </button>
          <div className="session-title-area">
            <h1>
              Session {sessionNumber} <span>· Exercise {currentIndex + 1} of {exercises.length}</span>
            </h1>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(currentIndex / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="main-container">
        
        {/* TOP ROW: Video (Left) & Info (Right) */}
        <div className="top-row">
          
          {/* Left: Video Player */}
          <div className="video-column">
            <ExerciseMediaCarousel 
              videoUrl={currentExercise.video_url} 
              imageUrls={currentExercise.image_urls} 
            />
          </div>
          
          {/* Right: Exercise Details */}
          <div className="info-card">
            <div className="exercise-title-row">
              <h2>{currentExercise.exercise_name}</h2>
              {currentExercise.target_body_part && (
                <span className="badge">
                  {currentExercise.target_body_part}
                </span>
              )}
            </div>
            <div className="prescribed-text">
              Prescribed: {currentExercise.prescribed_sets} Sets × {currentExercise.prescribed_reps} Reps
            </div>

            {currentExercise.instructions && (
              <>
                <span className="section-label">Instructions</span>
                <ul className="instructions-list">
                  {currentExercise.instructions.split('\n').map((instruction, idx) => (
                    instruction.trim() ? <li key={idx}>{instruction.trim()}</li> : null
                  ))}
                </ul>
              </>
            )}

            {currentExercise.doctor_notes && (
              <div style={{ marginTop: '1.5rem' }}>
                <span className="section-label">Doctor's Note</span>
                <div className="doctor-note-box">
                  {currentExercise.doctor_notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ROW: Log Progress Form (Full Width) */}
        <div className="log-card">
          <h2>Log Your Progress</h2>

          {/* 2-Column Grid inside the Form */}
          <div className="form-grid">
            
            {/* Left Form Column */}
            <div className="form-col">
              <div className="form-group">
                <span className="form-label">Sets Completed (Goal: {prescribedSets})</span>
                <div className="sets-selector">
                  {chipNumbers.map(n => (
                    <button
                      key={n}
                      onClick={() => setSetsCompleted(n)}
                      className={`set-chip ${setsCompleted === n ? 'active' : ''} ${shakeChips && setsCompleted === null ? 'shake' : ''}`}
                    >
                      {n}
                    </button>
                  ))}
                  {prescribedSets >= 3 && (
                    <button
                      onClick={() => setSetsCompleted(99)}
                      className={`set-chip ${setsCompleted === 99 ? 'active' : ''} ${shakeChips && setsCompleted === null ? 'shake' : ''}`}
                    >
                      More
                    </button>
                  )}
                </div>
                {shakeChips && setsCompleted === null && (
                  <p className="pain-level-value danger shake" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Please select how many sets you completed.</p>
                )}
              </div>

              <div className="form-group">
                <div className="slider-labels">
                  <span className={painLevel <= 3 ? 'safe' : ''}>0 — None</span>
                  <span style={{ color: 'var(--heading-text-color)' }}>
                    Pain Level: <strong className={painLevel <= 3 ? 'safe' : painLevel <= 6 ? 'warning' : 'danger'}>{getPainLabel(painLevel)}</strong>
                  </span>
                  <span className={painLevel > 6 ? 'danger' : ''}>10 — Severe</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={painLevel}
                  onChange={e => setPainLevel(Number(e.target.value))}
                  className="pain-slider"
                />
              </div>
            </div>

            {/* Right Form Column */}
            <div className="form-col">
              <div className="form-group">
                <span className="form-label">Comments (Optional)</span>
                <textarea
                  placeholder="How did it feel? Any difficulties?"
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  className="comments-textarea"
                />
              </div>

              <div className="form-group">
                <span className="form-label">Flag a concern? (Optional)</span>
                <div className="concerns-grid">
                  {concerns.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConcern(selectedConcern === c.id ? null : c.id)}
                      className={`concern-btn ${selectedConcern === c.id ? 'active' : ''}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div> {/* End Form Grid */}

          {/* Form Footer */}
          <div className="action-footer">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-next"
            >
              {isSubmitting ? (
                <div className="spinner"></div>
              ) : isLastExercise ? (
                <>Complete Session <i className="fa-solid fa-check-double" style={{ marginLeft: '0.5rem' }}></i></>
              ) : (
                <>Next Exercise <i className="fa-solid fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i></>
              )}
            </button>
            <button
              onClick={() => setShowSkipConfirm(true)}
              disabled={isSubmitting}
              className="btn-skip"
            >
              Skip this exercise
            </button>
          </div>

        </div> {/* End Log Card */}

      </div>

      {/* Modals */}
      {showHighPainModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon-wrapper">
              <div className="modal-icon-bg">
                <AlertTriangle size={32} />
              </div>
            </div>
            <h3>High Pain Level Logged</h3>
            <p>
              You reported <strong>{painLevel}/10</strong> pain. If this feels sudden, worsening, or wrong, please contact the clinic:
            </p>
            <div className="modal-phone">
              <a href="tel:+919876543210">+91 98765 43210</a>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowHighPainModal(false);
                  setIsConcernModalOpen(true);
                }}
                className="btn-modal-primary danger"
              >
                Report a Concern
              </button>
              <button 
                onClick={() => {
                  setShowHighPainModal(false);
                  proceedAfterSave();
                }}
                className="btn-modal-text"
              >
                OK, Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {showSkipConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Skip this exercise?</h3>
            <p>
              Skipping marks this session as missed. Your doctor will see this in your progress report.
            </p>
            <div className="modal-actions row">
              <button 
                onClick={() => setShowSkipConfirm(false)}
                className="btn-modal-secondary"
              >
                Go Back
              </button>
              <button 
                onClick={handleSkipConfirm}
                className="btn-modal-primary danger"
              >
                Skip Anyway
              </button>
            </div>
          </div>
        </div>
      )}

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
