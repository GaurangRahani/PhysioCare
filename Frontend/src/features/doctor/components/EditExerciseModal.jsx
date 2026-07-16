import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, Save, AlertTriangle, Loader2 } from 'lucide-react';

const EditExerciseModal = ({ isOpen, onClose, exercise, mode, onUpdate }) => {
  const { getToken } = useAuth();
  
  const [sets, setSets] = useState(exercise?.sets || 3);
  const [reps, setReps] = useState(exercise?.reps || 10);
  const [frequencyType, setFrequencyType] = useState(exercise?.frequency_type || 'daily');
  const [frequencyDays, setFrequencyDays] = useState(
    Array.isArray(exercise?.frequency_days) ? exercise.frequency_days : 
    (typeof exercise?.frequency_days === 'number' ? [] : []) // Ideally decode if bitmask, but simple for now
  );
  const [sessionsPerDay, setSessionsPerDay] = useState(exercise?.sessions_per_day || 1);
  const [endDate, setEndDate] = useState(exercise?.end_date?.substring(0, 10) || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(exercise?.notes || '');
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && exercise) {
      setSets(exercise.sets || 3);
      setReps(exercise.reps || 10);
      setFrequencyType(exercise.frequency_type || 'daily');
      
      // Basic decoding if backend sent bitmask (for UI simplicity, if we don't have decode logic here, we just reset it)
      if (exercise.frequency_type === 'custom_days' && Array.isArray(exercise.frequency_days)) {
         setFrequencyDays(exercise.frequency_days);
      } else {
         setFrequencyDays([]);
      }
      
      setSessionsPerDay(exercise.sessions_per_day || 1);
      setEndDate(exercise.end_date ? exercise.end_date.substring(0, 10) : new Date().toISOString().split('T')[0]);
      setNotes(exercise.notes || '');
    }
  }, [isOpen, exercise]);

  const handleCustomDayToggle = (dayIndex) => {
    setFrequencyDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleSave = async () => {
    if (frequencyType === 'custom_days' && frequencyDays.length === 0) {
      alert("Please select at least one day for custom frequency.");
      return;
    }

    const payload = {
      sets: parseInt(sets),
      reps: parseInt(reps),
      sessions_per_day: parseInt(sessionsPerDay),
      frequency_type: frequencyType,
      frequency_days: frequencyType === 'custom_days' ? frequencyDays : null,
      end_date: endDate,
      notes
    };

    if (mode === 'new') {
      // Local update
      onUpdate({ ...exercise, ...payload });
    } else {
      // API Update
      try {
        setSaving(true);
        const token = await getToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const res = await fetch(`${apiUrl}/api/treatment-plans/assignments/${exercise.id}`, {
          method: 'PATCH',
          headers: {
             'Content-Type': 'application/json',
             Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (data.success) {
          // The backend returns new_assignment. We need to preserve the `exercise` joined object if it exists.
          onUpdate({ ...data.new_assignment, exercise: exercise.exercise });
        } else {
          alert(data.message || "Failed to update exercise.");
        }
      } catch (err) {
         console.error(err);
         alert("Network error.");
      } finally {
        setSaving(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-extrabold text-heading">
            Edit: {exercise?.exercise?.name || 'Exercise'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-5">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-heading mb-2">Sets</label>
                   <input type="number" min="1" value={sets} onChange={e => setSets(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 font-medium" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-heading mb-2">Reps</label>
                   <input type="number" min="1" value={reps} onChange={e => setReps(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 font-medium" />
                </div>
             </div>

             <div>
                <label className="block text-sm font-bold text-heading mb-2">Frequency</label>
                <select value={frequencyType} onChange={e => setFrequencyType(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 font-medium bg-white">
                  <option value="daily">Daily</option>
                  <option value="alternate_days">Alternate Days</option>
                  <option value="mon_wed_fri">Mon / Wed / Fri</option>
                  <option value="tue_thu_sat">Tue / Thu / Sat</option>
                  <option value="custom_days">Custom Days</option>
                </select>
             </div>

             {frequencyType === 'custom_days' && (
               <div className="flex flex-wrap gap-2">
                 {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, idx) => (
                   <button 
                     key={idx}
                     onClick={() => handleCustomDayToggle(idx)}
                     className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${frequencyDays.includes(idx) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                   >
                     {day}
                   </button>
                 ))}
               </div>
             )}

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-heading mb-2">Sessions Per Day</label>
                   <select value={sessionsPerDay} onChange={e => setSessionsPerDay(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-3 font-medium bg-white">
                     <option value="1">1x per day</option>
                     <option value="2">2x per day</option>
                     <option value="3">3x per day</option>
                   </select>
                </div>
                <div></div>
             </div>

             <div>
                <label className="block text-sm font-bold text-heading mb-2">Notes for Patient (Optional)</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 font-medium min-h-[80px]"
                ></textarea>
             </div>

             {mode === 'modify' && (
               <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex gap-3 text-sm font-medium text-yellow-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-yellow-600" />
                  <p>
                    <strong>Note:</strong> Changing frequency updates the patient's schedule from today onward. Past compliance history is preserved.
                  </p>
               </div>
             )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-dark transition-all shadow-md flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditExerciseModal;
