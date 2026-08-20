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
      <div className="shape shape-circle"></div>

      {/* Top Session Navigation Context */}
      <div className="session-top-bar">
          <div className="container">
              <div className="session-title-wrapper">
                  <button onClick={handleBack} className="btn-back-link">
                    <ChevronLeft size={24} />
                  </button>
                  <span>Session {sessionNumber} <span className="muted">· Exercise {currentIndex + 1} of {exercises.length}</span></span>
              </div>
          </div>
          <div className="top-progress-bar">
              <div 
                className="top-progress-fill" 
                style={{ width: `${((currentIndex) / exercises.length) * 100}%` }}
              ></div>
          </div>
      </div>

      {/* Main Content Container */}
      <main className="container">
          
          {/* Video & Information Row */}
          <div className="exercise-grid">
              
              {/* Video Section */}
              <div className="video-card-container">
                  <ExerciseMediaCarousel 
                    videoUrl={currentExercise.video_url} 
                    imageUrls={currentExercise.image_urls} 
                  />
              </div>

              {/* Details Section */}
              <div className="info-card">
                  <div className="info-header">
                      <h2>{currentExercise.exercise_name}</h2>
                      {currentExercise.target_body_part && (
                        <span className="badge">{currentExercise.target_body_part}</span>
                      )}
                  </div>
                  <div className="prescribed">Prescribed: {prescribedSets} Sets × {currentExercise.prescribed_reps} Reps</div>
                  
                  {currentExercise.instructions && (
                    <>
                      <div className="instructions-label">Instructions</div>
                      <ul className="instructions-list">
                          {currentExercise.instructions.split('\n').map((instruction, idx) => (
                              instruction.trim() ? <li key={idx}>{instruction.trim()}</li> : null
                          ))}
                      </ul>
                    </>
                  )}

                  {currentExercise.doctor_notes && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <span className="instructions-label">Doctor's Note</span>
                      <div className="doctor-note-box">
                        {currentExercise.doctor_notes}
                      </div>
                    </div>
                  )}
              </div>
          </div>

          {/* Log Progress Section */}
          <div className="progress-card">
              <h3 className="progress-title">Log Your Progress</h3>
              
              <div className="form-grid">
                  
                  {/* Top Left: Sets Completed */}
                  <div className="form-group">
                      <label className="form-label">Sets Completed (Goal: {prescribedSets})</label>
                      <div className="btn-group">
                          {chipNumbers.map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setSetsCompleted(n)}
                                className={`btn-outline ${setsCompleted === n ? 'active' : ''}`}
                            >
                                {n}
                            </button>
                          ))}
                          {prescribedSets >= 3 && (
                            <button
                                type="button"
                                onClick={() => setSetsCompleted(99)}
                                className={`btn-outline ${setsCompleted === 99 ? 'active' : ''}`}
                            >
                                More
                            </button>
                          )}
                      </div>
                      {shakeChips && setsCompleted === null && (
                        <p className="shake" style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Please select how many sets you completed.</p>
                      )}
                  </div>

                  {/* Top Right: Pain Level */}
                  <div className="form-group" style={{ marginTop: '0' }}>
                      <label className="form-label">Pain Level (0-10)</label>
                      <div className="range-wrapper" style={{ marginTop: '0' }}>
                          <div className="range-labels">
                              <span className="label-none">0 — None</span>
                              <span className="label-none" style={{ color: 'var(--primary)' }}>Current: {painLevel}</span>
                              <span className="label-severe">10 — Severe</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="10" 
                            value={painLevel} 
                            onChange={e => setPainLevel(Number(e.target.value))} 
                          />
                      </div>
                  </div>

                  {/* Bottom Left: Comments */}
                  <div className="form-group" style={{ height: '100%', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                      <label className="form-label">Comments (Optional)</label>
                      <textarea 
                        placeholder="How did it feel? Any difficulties?"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        style={{ flex: 1, resize: 'none', padding: '15px', minHeight: 0, boxSizing: 'border-box' }}
                      ></textarea>
                  </div>

                  {/* Bottom Right: Flag a concern */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Flag a concern? (Optional)</label>
                      <div className="btn-grid">
                          {concerns.map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setSelectedConcern(selectedConcern === c.id ? null : c.id)}
                                className={`btn-outline ${selectedConcern === c.id ? 'active' : ''}`}
                            >
                                {c.label}
                            </button>
                          ))}
                      </div>
                  </div>

              </div>

              {/* Footer Action */}
              <div className="action-footer">
                  <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="btn-complete">
                      {isSubmitting ? (
                        <span>Saving...</span>
                      ) : isLastExercise ? (
                        <>Complete Session <i className="fa-solid fa-check-double" style={{ marginLeft: '0.5rem' }}></i></>
                      ) : (
                        <>
                          Complete & Next 
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.5rem' }}>
                              <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </>
                      )}
                  </button>
                  <button type="button" onClick={() => setShowSkipConfirm(true)} disabled={isSubmitting} className="btn-skip">Skip this exercise</button>
              </div>

          </div>

      </main>

      {/* Modals */}
      {showHighPainModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ marginBottom: '1rem', color: 'var(--danger)' }}>
                <AlertTriangle size={48} style={{ margin: '0 auto' }} />
            </div>
            <h3>High Pain Level Logged</h3>
            <p style={{ margin: '1rem 0' }}>
              You reported <strong>{painLevel}/10</strong> pain. If this feels sudden, worsening, or wrong, please contact the clinic:
            </p>
            <div style={{ margin: '1.5rem 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <a href="tel:+919876543210" style={{ color: 'var(--primary)', textDecoration: 'none' }}>+91 98765 43210</a>
            </div>
            <div className="modal-actions row">
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
                className="btn-modal-secondary"
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
            <p style={{ margin: '1rem 0', color: 'var(--gray-500)' }}>
              Skipping marks this exercise as missed. Your doctor will see this in your progress report.
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
