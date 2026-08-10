import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import AddExerciseModal from '../components/AddExerciseModal';
import EditExerciseModal from '../components/EditExerciseModal';
import './ConsultationFlow.css';

const TreatmentPlanBuilder = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();

  const appointment = location.state?.appointment;
  const overviewData = location.state?.overviewData;
  const consultation = location.state?.consultation;

  const { user, active_plan } = overviewData || {};

  const [mode, setMode] = useState(active_plan ? 'modify' : 'new');
  
  // New Plan State
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanStartDate, setNewPlanStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 28);
  const [newPlanEndDate, setNewPlanEndDate] = useState(defaultEnd.toISOString().split('T')[0]);
  
  const [newPlanExercises, setNewPlanExercises] = useState([]);
  
  // Existing Plan State
  const [existingExercises, setExistingExercises] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);

  const [saving, setSaving] = useState(false);
  const [activePlanIdToDiscontinue, setActivePlanIdToDiscontinue] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'modify' && active_plan) {
      fetchExistingExercises();
    }
  }, [mode, active_plan, getToken]);

  const fetchExistingExercises = async () => {
    try {
      setLoadingExisting(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/treatment-plans/${active_plan.id}/exercises`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setExistingExercises(
          data.data
            .filter(e => e.is_active)
            .map(e => ({ ...e, _localStatus: 'unchanged' }))
        );
      }
    } catch (err) {
      console.error("Failed to load existing exercises:", err);
    } finally {
      setLoadingExisting(false);
    }
  };

  if (!appointment || !overviewData || !consultation) {
    return (
      <div className="consultation-flow-theme" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="alert-warning" style={{ justifyContent: 'center', marginBottom: '1rem', display: 'inline-flex' }}>
            <i className="fa-solid fa-triangle-exclamation"></i> Missing consultation context. Please start from the dashboard.
          </div>
          <br/>
          <Link to="/doctor-dashboard" className="btn-outline">
            <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleFinish = async () => {
    try {
      setSaving(true);
      setError('');
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      if (mode === 'new') {
        if (!newPlanTitle.trim()) {
          setError("Plan title is required.");
          setSaving(false);
          return;
        }

        const payload = {
          consultation_id: consultation.id,
          patient_id: appointment.patient_id,
          title: newPlanTitle.trim(),
          start_date: newPlanStartDate,
          end_date: newPlanEndDate,
          exercises: newPlanExercises.map(ex => ({
             ...ex,
             start_date: newPlanStartDate,
             end_date: newPlanEndDate
          }))
        };

        const res = await fetch(`${apiUrl}/api/treatment-plans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (!data.success) {
          if (res.status === 409 && data.active_plan_id) {
            setActivePlanIdToDiscontinue(data.active_plan_id);
            setError(''); 
          } else {
            setError(data.message || "Failed to create plan.");
          }
          setSaving(false);
          return;
        }
      } else if (mode === 'modify') {
        for (const ex of existingExercises) {
          let res;
          if (ex._localStatus === 'added') {
            res = await fetch(`${apiUrl}/api/treatment-plans/${active_plan.id}/exercises`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(ex)
            });
          } else if (ex._localStatus === 'modified') {
            res = await fetch(`${apiUrl}/api/treatment-plans/assignments/${ex.id}/modify`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(ex)
            });
          } else if (ex._localStatus === 'discontinued') {
            res = await fetch(`${apiUrl}/api/treatment-plans/assignments/${ex.id}/discontinue`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          
          if (res) {
            const data = await res.json();
            if (!data.success) {
              throw new Error(`Failed to save exercise ${ex.name || ex.exercise?.name}: ${data.message}`);
            }
          }
        }
      }
      
      const statusRes = await fetch(`${apiUrl}/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });

      if (!statusRes.ok) console.warn("Could not mark appointment as completed.");
      navigate('/doctor-dashboard');
      
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving the plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscontinueAndRetry = async () => {
    try {
      setSaving(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/treatment-plans/${activePlanIdToDiscontinue}/discontinue`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        setActivePlanIdToDiscontinue(null);
        await handleFinish();
      } else {
        setError(data.message || "Failed to discontinue old plan.");
        setSaving(false);
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while discontinuing the old plan.");
      setSaving(false);
    }
  };

  const onAddExercise = async (exerciseConfig) => {
    if (mode === 'new') {
      setNewPlanExercises([...newPlanExercises, exerciseConfig]);
    } else {
      setExistingExercises([...existingExercises, { ...exerciseConfig, _localStatus: 'added', id: Date.now() }]);
    }
    setIsAddModalOpen(false);
  };

  const handleDiscontinue = (tpeId) => {
    if (mode === 'new') {
      setNewPlanExercises(newPlanExercises.filter((_, i) => i !== tpeId)); 
    } else {
      setExistingExercises(existingExercises.map(e => 
        e.id === tpeId ? { ...e, _localStatus: 'discontinued' } : e
      ));
    }
  };

  const formatFrequency = (type, days) => {
    if (type === 'daily') return 'Daily';
    if (type === 'alternate_days') return 'Alternate Days';
    if (type === 'mon_wed_fri') return 'Mon/Wed/Fri';
    if (type === 'tue_thu_sat') return 'Tue/Thu/Sat';
    if (type === 'custom_days') return 'Custom Days';
    return type;
  };

  const currentList = mode === 'new' ? newPlanExercises : existingExercises;

  return (
    <div className="consultation-flow-theme">
      
      {/* FIXED THEME BACKGROUND */}
      <div className="theme-bg" style={{ backgroundImage: 'url(/images/banner/img1.jpg)' }}>
        <img className="pt-img1" style={{ animation: 'left-right 8s infinite ease-in-out' }} src="/images/shap/wave-blue.png" alt=""/>
        <img className="pt-img2" style={{ animation: 'up-down 6s infinite ease-in-out' }} src="/images/shap/circle-dots.png" alt=""/>
        <img className="pt-img3" style={{ animation: 'rotation 20s infinite linear' }} src="/images/shap/plus-blue.png" alt=""/>
        <div className="bg-shape-bottom"></div>
      </div>

      <div className="flow-container">
        <button className="back-nav" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left"></i> Back
        </button>

        <div className="step-container active">
          
          {error && (
            <div className="alert-warning" style={{ backgroundColor: 'rgba(247, 43, 80, 0.08)', borderColor: 'rgba(247, 43, 80, 0.2)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--danger)' }}></i> {error}
            </div>
          )}

          {activePlanIdToDiscontinue && (
            <div className="alert-warning" style={{ flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <div>
                  <strong>Patient has an active plan</strong><br/>
                  This patient already has an active treatment plan. Creating a new one will discontinue their old plan and remove any of its future scheduled exercises. Do you want to proceed?
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button onClick={handleDiscontinueAndRetry} disabled={saving} className="btn-primary" style={{ backgroundColor: 'var(--danger)', padding: '0.5rem 1rem' }}>
                  {saving ? 'Processing...' : 'Yes, Discontinue Old Plan'}
                </button>
                <button onClick={() => setActivePlanIdToDiscontinue(null)} disabled={saving} className="btn-outline">
                  No, Cancel
                </button>
              </div>
            </div>
          )}

          {/* Header Card */}
          <div className="card card-accent-top">
              <h2 className="header-title"><i className="fa-solid fa-file-waveform"></i> Treatment Plan</h2>
              <div className="header-meta">Patient: {user?.name}</div>
          </div>

          {/* Toggle Cards (Modify vs New) */}
          <div className="card" style={{ paddingBottom: '1rem' }}>
              {active_plan && (
                <label className={`radio-card ${mode === 'modify' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="planType" 
                      value="modify" 
                      checked={mode === 'modify'} 
                      onChange={() => { setMode('modify'); setError(''); }} 
                    />
                    Modify existing plan: '{active_plan.title}'
                </label>
              )}
              
              <label className={`radio-card ${mode === 'new' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="planType" 
                    value="new" 
                    checked={mode === 'new'} 
                    onChange={() => { setMode('new'); setError(''); }} 
                  />
                  Create a new plan
              </label>
          </div>

          {/* DYNAMIC VIEW: Modify Existing Plan or New Plan Details */}
          <div className="card">
              {mode === 'new' && (
                <>
                  <div className="form-group">
                      <label className="form-label">Plan Title <span className="req">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Lower Back Recovery"
                        value={newPlanTitle}
                        onChange={e => setNewPlanTitle(e.target.value)}
                      />
                  </div>

                  <div className="dates-row form-group">
                      <div>
                          <label className="form-label">Start Date</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={newPlanStartDate}
                            onChange={e => setNewPlanStartDate(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="form-label">End Date</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={newPlanEndDate}
                            onChange={e => setNewPlanEndDate(e.target.value)}
                          />
                      </div>
                  </div>
                </>
              )}

              <div className="exercise-list-header" style={{ marginTop: mode === 'new' ? '2.5rem' : '0' }}>
                Current Exercises
              </div>
              
              {loadingExisting ? (
                 <div className="empty-state">
                   <Loader2 className="fa-spin" style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto', opacity: 0.5, color: 'var(--primary)' }} />
                 </div>
              ) : currentList.length === 0 ? (
                <div className="empty-state">
                    <i className="fa-solid fa-dumbbell"></i>
                    <div>No exercises added yet.</div>
                </div>
              ) : (
                <div className="exercise-list">
                  {currentList.map((ex, index) => {
                    const isDiscontinued = ex._localStatus === 'discontinued';
                    const isModified = ex._localStatus === 'modified';
                    const isAdded = ex._localStatus === 'added';
                    
                    return (
                      <div key={ex.id || index} className="exercise-item" style={isDiscontinued ? { opacity: 0.5, backgroundColor: 'var(--gray-50)', paddingLeft: '0.5rem', paddingRight: '0.5rem', borderRadius: '8px' } : {}}>
                          <div style={isDiscontinued ? { textDecoration: 'line-through' } : {}}>
                              <div className="ex-name">
                                {ex.exercise?.name || ex.name || 'Exercise ' + (ex.exercise_id)}
                                {isModified && <span style={{ marginLeft: '10px', fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block', verticalAlign: 'middle' }}>MODIFIED</span>}
                                {isAdded && <span style={{ marginLeft: '10px', fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block', verticalAlign: 'middle' }}>ADDED</span>}
                              </div>
                              <div className="ex-meta">
                                  <span className="badge-purple">{ex.sets} sets &times; {ex.reps} reps</span>
                                  <span>{formatFrequency(ex.frequency_type, ex.frequency_days)}</span>
                                  <span>{ex.sessions_per_day}x/day</span>
                              </div>
                          </div>
                          {!isDiscontinued ? (
                            <div className="ex-actions">
                                <button className="btn-text-primary" onClick={() => setEditingExercise(mode === 'new' ? { ...ex, index } : ex)}>Edit</button>
                                <button className="btn-text-danger" onClick={() => handleDiscontinue(mode === 'new' ? index : ex.id)}>Discontinue</button>
                            </div>
                          ) : (
                            <div className="ex-actions" style={{ opacity: 0.8, color: 'var(--gray-400)' }}>
                              <i className="fa-solid fa-circle-exclamation"></i> Discontinued
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="add-exercise-btn" onClick={() => setIsAddModalOpen(true)}>
                  + Add Exercise
              </button>
          </div>

          <div className="flex-end">
              <button className="btn-primary" onClick={handleFinish} disabled={saving}>
                  {saving ? <Loader2 className="fa-spin" style={{ width: '1.2rem', height: '1.2rem' }} /> : <i className="fa-regular fa-circle-check"></i>} 
                  {saving ? 'Saving...' : 'Save Plan & Finish Visit'}
              </button>
          </div>
        </div>

      </div>

      {/* Modals */}
      {/* We keep the same modal components but they need their internal CSS updated too. */}
      <AddExerciseModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={onAddExercise} 
        defaultDates={
          mode === 'modify' && active_plan 
            ? { start: newPlanStartDate, end: active_plan.end_date } 
            : { start: newPlanStartDate, end: newPlanEndDate }
        }
        currentExercises={currentList}
        onEditExisting={(ex) => {
          setEditingExercise(mode === 'new' ? { ...ex, index: currentList.indexOf(ex) } : ex);
        }}
      />
      
      {editingExercise && (
        <EditExerciseModal
          isOpen={true}
          onClose={() => setEditingExercise(null)}
          exercise={editingExercise}
          mode={mode}
          onUpdate={(updatedData) => {
             if (mode === 'new') {
               const newList = [...newPlanExercises];
               newList[editingExercise.index] = updatedData;
               setNewPlanExercises(newList);
             } else {
               setExistingExercises(existingExercises.map(e => 
                 e.id === updatedData.id 
                 ? { ...e, ...updatedData, _localStatus: e._localStatus === 'added' ? 'added' : 'modified' } 
                 : e
               ));
             }
             setEditingExercise(null);
          }}
        />
      )}

    </div>
  );
};

export default TreatmentPlanBuilder;
