import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  Loader2, ArrowLeft, Dumbbell, Plus, Edit2, Trash2, CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import AddExerciseModal from '../components/AddExerciseModal';
import EditExerciseModal from '../components/EditExerciseModal';

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
      <div className="max-w-2xl mx-auto my-16 p-8 bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl text-center font-['Inter',system-ui,sans-serif]">
        <div className="w-12 h-12 rounded-full bg-[#FFF2CC] text-[#805B00] flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={22} />
        </div>
        <h3 className="text-[16px] font-semibold text-[#202223] m-0">Missing Consultation Context</h3>
        <p className="text-[13px] text-[#616161] mt-1.5 mb-5 max-w-sm mx-auto">
          Please complete Step 1 (Clinical Assessment) before constructing the treatment plan.
        </p>
        <Link to="/doctor-dashboard/patients" className="btn-secondary-saas inline-flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Patients
        </Link>
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
      
      // Mark appointment completed
      const statusRes = await fetch(`${apiUrl}/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });

      if (!statusRes.ok) console.warn("Could not mark appointment as completed.");
      navigate('/doctor-dashboard/patients');
      
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving the treatment plan.");
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

  const formatFrequency = (type) => {
    if (type === 'daily') return 'Daily';
    if (type === 'alternate_days') return 'Alternate Days';
    if (type === 'mon_wed_fri') return 'Mon / Wed / Fri';
    if (type === 'tue_thu_sat') return 'Tue / Thu / Sat';
    if (type === 'custom_days') return 'Custom Days';
    return type;
  };

  const currentList = mode === 'new' ? newPlanExercises : existingExercises;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto font-['Inter',system-ui,sans-serif] text-[#202223] animate-fade-in">
      
      {/* ── Top Navigation Breadcrumb ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#616161] hover:text-[#202223] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Assessment</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-[12px] text-[#8A8A8A]">
          <span className="font-semibold text-[#111111] bg-[#F7F7F7] border border-[#E5E5E5] px-2.5 py-0.5 rounded-md">
            Step 2 of 2
          </span>
          <span>Treatment Plan Formulation</span>
        </div>
      </div>

      {/* ── Consultation Header Summary ────────────────────────────── */}
      <div className="saas-card p-6 bg-[#FFFFFF]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#FFFFFF] flex items-center justify-center shrink-0">
              <Dumbbell size={20} />
            </div>
            <div>
              <h1 className="text-[20px] font-semibold text-[#202223] tracking-tight m-0">
                Prescribe Rehabilitation Plan
              </h1>
              <p className="text-[13px] text-[#616161] mt-0.5 m-0">
                Patient: <strong className="text-[#202223]">{user?.name}</strong> • Diagnosis: <strong className="text-[#202223]">{consultation?.diagnosis || 'Evaluated'}</strong>
              </p>
            </div>
          </div>

          <span className="badge-semantic-success flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium shrink-0">
            <CheckCircle2 size={13} /> Assessment Saved
          </span>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-3.5 bg-[#FCE4E4] border border-[#E5484D] text-[#B42318] text-[13px] rounded-xl flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Plan Conflict Warning Modal / Banner */}
        {activePlanIdToDiscontinue && (
          <div className="mt-4 p-4 bg-[#FFF2CC] border border-[#F5C451] rounded-xl text-[#805B00] text-[13px] flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 text-[#805B00] mt-0.5" />
              <div>
                <strong className="block font-semibold text-[#202223]">Existing Plan Overwrite Required</strong>
                <p className="mt-1 m-0 leading-relaxed text-[#616161]">
                  This patient currently has an active plan (<strong>{active_plan?.title}</strong>). Creating this new treatment plan will automatically discontinue their previous plan and replace all future scheduled exercises.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 ml-7">
              <button 
                type="button" 
                onClick={handleDiscontinueAndRetry} 
                disabled={saving}
                className="bg-[#B42318] hover:bg-[#991B1B] text-white px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer"
              >
                {saving ? 'Processing...' : 'Discontinue Old Plan & Save'}
              </button>
              <button 
                type="button" 
                onClick={() => setActivePlanIdToDiscontinue(null)} 
                disabled={saving}
                className="btn-secondary-saas text-[12px] py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Plan Mode Selector ─────────────────────────────────────── */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {active_plan && (
            <label className={`flex-1 p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
              mode === 'modify' 
                ? 'border-[#111111] bg-[#FAFAFA] shadow-xs' 
                : 'border-[#E5E5E5] hover:bg-[#F9F9F9]'
            }`}>
              <input 
                type="radio" 
                name="planType" 
                value="modify" 
                checked={mode === 'modify'} 
                onChange={() => { setMode('modify'); setError(''); }} 
                className="mt-1 text-[#111111] focus:ring-0 cursor-pointer"
              />
              <div>
                <span className="text-[13px] font-semibold text-[#202223] block">
                  Modify Existing Plan: "{active_plan.title}"
                </span>
                <span className="text-[12px] text-[#616161] mt-0.5 block leading-normal">
                  Add, update, or discontinue exercises in their ongoing rehabilitation protocol.
                </span>
              </div>
            </label>
          )}

          <label className={`flex-1 p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
            mode === 'new' 
              ? 'border-[#111111] bg-[#FAFAFA] shadow-xs' 
              : 'border-[#E5E5E5] hover:bg-[#F9F9F9]'
          }`}>
            <input 
              type="radio" 
              name="planType" 
              value="new" 
              checked={mode === 'new'} 
              onChange={() => { setMode('new'); setError(''); }} 
              className="mt-1 text-[#111111] focus:ring-0 cursor-pointer"
            />
            <div>
              <span className="text-[13px] font-semibold text-[#202223] block">
                Create Brand New Treatment Plan
              </span>
              <span className="text-[12px] text-[#616161] mt-0.5 block leading-normal">
                Archive previous plan and establish a completely fresh recovery schedule.
              </span>
            </div>
          </label>
        </div>

        {/* ── New Plan Fields (if mode === 'new') ─────────────────────── */}
        {mode === 'new' && (
          <div className="mt-5 p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-1.5">
                Plan Title <span className="text-[#E5484D]">*</span>
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all"
                placeholder="e.g. Lumbar Stabilization & Core Strength Protocol"
                value={newPlanTitle}
                onChange={e => setNewPlanTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-[#202223] block mb-1">
                  Start Date
                </label>
                <input 
                  type="date" 
                  className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] font-mono"
                  value={newPlanStartDate}
                  onChange={e => setNewPlanStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#202223] block mb-1">
                  Target End Date
                </label>
                <input 
                  type="date" 
                  className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] font-mono"
                  value={newPlanEndDate}
                  onChange={e => setNewPlanEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Prescribed Exercises Matrix ────────────────────────────── */}
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
            <div>
              <h3 className="text-[15px] font-semibold text-[#202223] m-0">
                Prescribed Exercises
              </h3>
              <p className="text-[12px] text-[#616161] mt-0.5 m-0">
                {currentList.filter(e => e._localStatus !== 'discontinued').length} active exercises in this regimen
              </p>
            </div>

            <button 
              type="button" 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary-saas flex items-center gap-1.5 text-[12px] py-1.5 px-3"
            >
              <Plus size={13} />
              <span>Add Exercise</span>
            </button>
          </div>

          {loadingExisting ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#8A8A8A]">
              <Loader2 size={20} className="animate-spin text-[#202223]" />
              <span className="text-[12px]">Loading existing exercises...</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="py-12 px-4 rounded-xl border border-dashed border-[#CCCCCC] bg-[#FAFAFA] flex flex-col items-center justify-center text-center">
              <Dumbbell size={24} className="text-[#8A8A8A] mb-2" />
              <h4 className="text-[14px] font-semibold text-[#202223] m-0">No Exercises Prescribed</h4>
              <p className="text-[12px] text-[#616161] mt-1 mb-3 max-w-xs">
                Select exercises from the library to configure sets, reps, and weekly training frequency.
              </p>
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(true)}
                className="btn-secondary-saas flex items-center gap-1.5 text-[12px]"
              >
                <Plus size={13} />
                <span>Browse Exercise Library</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#EAEAEA] border border-[#E5E5E5] rounded-xl overflow-hidden bg-[#FFFFFF]">
              {currentList.map((ex, index) => {
                const isDiscontinued = ex._localStatus === 'discontinued';
                const isModified = ex._localStatus === 'modified';
                const isAdded = ex._localStatus === 'added';
                const exerciseName = ex.exercise?.name || ex.name || `Exercise #${ex.exercise_id}`;
                const bodyPart = ex.exercise?.target_body_part || ex.target_body_part;

                return (
                  <div 
                    key={ex.id || index}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isDiscontinued ? 'bg-[#FCFCFC] opacity-60' : 'hover:bg-[#F9F9F9]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[14px] font-semibold text-[#202223] ${isDiscontinued ? 'line-through text-[#8A8A8A]' : ''}`}>
                          {exerciseName}
                        </span>

                        {bodyPart && (
                          <span className="badge-semantic-neutral text-[10px]">
                            {bodyPart}
                          </span>
                        )}

                        {isAdded && (
                          <span className="badge-semantic-success text-[10px] font-semibold uppercase">
                            Added
                          </span>
                        )}

                        {isModified && (
                          <span className="badge-semantic-warning text-[10px] font-semibold uppercase">
                            Modified
                          </span>
                        )}

                        {isDiscontinued && (
                          <span className="badge-semantic-error text-[10px] font-semibold uppercase">
                            Discontinued
                          </span>
                        )}
                      </div>

                      {/* Specs: sets, reps, frequency */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#616161] mt-1.5">
                        <span className="font-mono bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5] font-medium text-[#202223]">
                          {ex.sets} sets × {ex.reps} reps
                        </span>
                        <span>•</span>
                        <span>{formatFrequency(ex.frequency_type)}</span>
                        <span>•</span>
                        <span>{ex.sessions_per_day}x daily</span>
                        {ex.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-[#8A8A8A]">"{ex.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!isDiscontinued ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingExercise(mode === 'new' ? { ...ex, index } : ex)}
                            className="p-1.5 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#202223] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit2 size={12} className="text-[#616161]" />
                            <span>Edit</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDiscontinue(mode === 'new' ? index : ex.id)}
                            className="p-1.5 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] hover:bg-[#FCE4E4] text-[#E5484D] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>{mode === 'new' ? 'Remove' : 'Discontinue'}</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-[#8A8A8A] italic">
                          Will be deactivated on save
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer Actions ─────────────────────────────────────────── */}
        <div className="mt-6 pt-4 border-t border-[#EAEAEA] flex items-center justify-between">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="btn-secondary-saas"
          >
            Back
          </button>

          <button 
            type="button" 
            onClick={handleFinish} 
            disabled={saving}
            className="btn-primary-saas flex items-center gap-2 text-[13px] py-2 px-4"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            <span>{saving ? 'Finalizing Protocol...' : 'Save Plan & Complete Consultation'}</span>
          </button>
        </div>

      </div>

      {/* ── Add Exercise Modal ──────────────────────────────────────── */}
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
      
      {/* ── Edit Exercise Modal ─────────────────────────────────────── */}
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
