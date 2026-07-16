import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ArrowLeft, CheckCircle2, Dumbbell, Plus, FileSignature, Loader2 } from 'lucide-react';
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

  const [mode, setMode] = useState(active_plan ? 'modify' : 'new'); // 'modify' | 'new'
  
  // New Plan State
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanStartDate, setNewPlanStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Set default end date to 4 weeks from today
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 28);
  const [newPlanEndDate, setNewPlanEndDate] = useState(defaultEnd.toISOString().split('T')[0]);
  
  const [newPlanExercises, setNewPlanExercises] = useState([]); // Exercises added locally before save
  
  // Existing Plan State
  const [existingExercises, setExistingExercises] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);

  const [saving, setSaving] = useState(false);
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
      // We don't have a specific endpoint for just exercises of a plan, but we can fetch the plan details
      // Wait, let's assume we can fetch it, or we need to add an endpoint.
      // The API `GET /api/patients/:id/progress` or `history` might have it.
      // For now, let's hit a mock or use `overviewData.active_plan.exercises` if the backend sends it.
      // Wait, does the backend send active_plan exercises in overview?
      // Yes, in `getPatientOverview` it joins treatmentPlanExercises.
      if (active_plan.exercises) {
        setExistingExercises(active_plan.exercises.filter(e => e.is_active));
      }
    } catch (err) {
      console.error("Failed to load existing exercises:", err);
    } finally {
      setLoadingExisting(false);
    }
  };

  if (!appointment || !overviewData || !consultation) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-danger p-4 rounded-xl border border-red-100 mb-4 inline-block">
          Missing consultation context. Please start from the dashboard.
        </div>
        <button onClick={() => navigate('/doctor-dashboard')} className="text-primary font-semibold hover:underline flex items-center justify-center gap-2 w-full mt-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
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
          setError(data.message || "Failed to create plan.");
          setSaving(false);
          return;
        }
      }
      
      // Mark the appointment as completed
      const statusRes = await fetch(`${apiUrl}/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });

      if (!statusRes.ok) {
        console.warn("Could not mark appointment as completed.");
      }

      navigate('/doctor-dashboard');
      
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving the plan.");
    } finally {
      setSaving(false);
    }
  };

  const onAddExercise = async (exerciseConfig) => {
    if (mode === 'new') {
      // Add locally
      setNewPlanExercises([...newPlanExercises, exerciseConfig]);
      setIsAddModalOpen(false);
    } else {
      // Add immediately to active plan
      try {
        const token = await getToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const res = await fetch(`${apiUrl}/api/treatment-plans/${active_plan.id}/exercises`, {
          method: 'POST',
          headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(exerciseConfig)
        });
        
        const data = await res.json();
        if (data.success) {
          setExistingExercises([...existingExercises, data.exercise]);
          setIsAddModalOpen(false);
        } else {
          alert(data.message || "Failed to add exercise.");
        }
      } catch (err) {
         console.error(err);
         alert("Network error.");
      }
    }
  };

  const handleDiscontinue = async (tpeId) => {
    if (mode === 'new') {
      setNewPlanExercises(newPlanExercises.filter((_, i) => i !== tpeId)); // Here tpeId is just the index for 'new'
    } else {
      if (!window.confirm("Are you sure you want to discontinue this exercise?")) return;
      try {
        const token = await getToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const res = await fetch(`${apiUrl}/api/treatment-plans/assignments/${tpeId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (data.success) {
          setExistingExercises(existingExercises.filter(e => e.id !== tpeId));
        } else {
          alert(data.message || "Failed to remove exercise.");
        }
      } catch (err) {
         console.error(err);
         alert("Network error.");
      }
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
        <div className="flex items-center gap-3 mb-1">
          <FileSignature className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-heading">Treatment Plan</h1>
        </div>
        <p className="text-gray-500 font-medium">Patient: {user?.name}</p>
      </div>

      {error && (
        <div className="bg-red-50 text-danger p-4 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        {active_plan && (
          <label className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors hover:bg-gray-50 border-gray-200">
            <input 
              type="radio" 
              name="mode" 
              checked={mode === 'modify'} 
              onChange={() => setMode('modify')}
              className="w-5 h-5 text-primary focus:ring-primary"
            />
            <span className="font-bold text-dark">Modify existing plan: '{active_plan.title}'</span>
          </label>
        )}
        
        <label className="flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors hover:bg-gray-50 border-gray-200">
          <input 
            type="radio" 
            name="mode" 
            checked={mode === 'new'} 
            onChange={() => setMode('new')}
            className="w-5 h-5 text-primary focus:ring-primary"
          />
          <span className="font-bold text-dark">Create a new plan</span>
        </label>
      </div>

      {/* New Plan Details */}
      {mode === 'new' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
           <div>
              <label className="block text-sm font-bold text-heading mb-2">Plan Title <span className="text-danger">*</span></label>
              <input 
                type="text" 
                value={newPlanTitle}
                onChange={e => setNewPlanTitle(e.target.value)}
                placeholder="e.g. Lower Back Recovery"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-heading mb-2">Start Date</label>
                <input 
                  type="date" 
                  value={newPlanStartDate}
                  onChange={e => setNewPlanStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-600"
                />
             </div>
             <div>
                <label className="block text-sm font-bold text-heading mb-2">End Date</label>
                <input 
                  type="date" 
                  value={newPlanEndDate}
                  onChange={e => setNewPlanEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-600"
                />
             </div>
           </div>
        </div>
      )}

      {/* Exercises List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-heading text-sm uppercase tracking-wide">Current Exercises</h3>
        </div>
        
        <div className="p-0">
          {loadingExisting ? (
             <div className="p-12 text-center flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : currentList.length === 0 ? (
             <div className="p-12 text-center">
               <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
               <p className="text-gray-500 font-medium">No exercises added yet.</p>
             </div>
          ) : (
            <div className="divide-y divide-gray-100">
               {currentList.map((ex, index) => (
                 <div key={ex.id || index} className="p-5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                       <h4 className="font-extrabold text-dark text-lg mb-1">{ex.exercise?.name || 'Exercise ' + (ex.exercise_id)}</h4>
                       <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
                         <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-bold">{ex.sets} sets &times; {ex.reps} reps</span>
                         <span>{formatFrequency(ex.frequency_type, ex.frequency_days)}</span>
                         <span>{ex.sessions_per_day}x/day</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                       <button onClick={() => setEditingExercise(mode === 'new' ? { ...ex, index } : ex)} className="text-sm font-bold text-gray-500 hover:text-dark transition-colors px-3 py-1.5 border border-gray-200 rounded-lg">Edit</button>
                       <button onClick={() => handleDiscontinue(mode === 'new' ? index : ex.id)} className="text-sm font-bold text-danger hover:bg-red-50 transition-colors px-3 py-1.5 border border-red-100 rounded-lg">Discontinue</button>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
        
        <div className="p-5 border-t border-gray-100 bg-gray-50/50">
          <button 
             onClick={() => setIsAddModalOpen(true)}
             className="w-full border-2 border-dashed border-gray-300 hover:border-primary hover:text-primary hover:bg-primary/5 text-gray-500 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Exercise
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleFinish}
          disabled={saving}
          className="bg-primary text-white font-bold px-10 py-4 rounded-xl hover:bg-dark transition-all shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          Save Plan & Finish Visit
        </button>
      </div>

      {/* Modals */}
      <AddExerciseModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={onAddExercise} 
        defaultDates={{ start: newPlanStartDate, end: newPlanEndDate }}
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
               // Update locally after successful PATCH
               setExistingExercises(existingExercises.map(e => e.id === updatedData.id ? updatedData : e));
             }
             setEditingExercise(null);
          }}
        />
      )}

    </div>
  );
};

export default TreatmentPlanBuilder;
