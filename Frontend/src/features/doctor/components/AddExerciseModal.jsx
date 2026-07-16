import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Search, Loader2, X, Plus, ChevronLeft, Calendar } from 'lucide-react';

const AddExerciseModal = ({ isOpen, onClose, onAdd, defaultDates }) => {
  const { getToken } = useAuth();
  const [step, setStep] = useState(1); // 1 = Search, 2 = Configure
  
  // Step 1: Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Step 2: Configuration state
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [frequencyType, setFrequencyType] = useState('daily');
  const [frequencyDays, setFrequencyDays] = useState([]); // for custom_days
  const [sessionsPerDay, setSessionsPerDay] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSearchQuery('');
      setSelectedExercise(null);
      setStartDate(defaultDates?.start || new Date().toISOString().split('T')[0]);
      setEndDate(defaultDates?.end || new Date().toISOString().split('T')[0]);
      setSets(3);
      setReps(10);
      setFrequencyType('daily');
      setSessionsPerDay(1);
      setNotes('');
      fetchExercises('');
    }
  }, [isOpen, defaultDates]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isOpen && step === 1) fetchExercises(searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchExercises = async (query) => {
    try {
      setLoadingSearch(true);
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/exercises?search=${encodeURIComponent(query)}&active_only=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setExercises(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelect = (ex) => {
    setSelectedExercise(ex);
    setStep(2);
  };

  const handleCustomDayToggle = (dayIndex) => {
    setFrequencyDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  // Simple live calculation of expected sessions
  const calculateExpected = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let count = 0;
    if (frequencyType === 'daily') count = diffDays;
    else if (frequencyType === 'alternate_days') count = Math.ceil(diffDays / 2);
    else if (frequencyType === 'mon_wed_fri') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if ([1,3,5].includes(d.getDay())) count++;
      }
    } else if (frequencyType === 'tue_thu_sat') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if ([2,4,6].includes(d.getDay())) count++;
      }
    } else if (frequencyType === 'custom_days') {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (frequencyDays.includes(d.getDay())) count++;
      }
    }
    
    return count * sessionsPerDay;
  };

  const expectedSessions = calculateExpected();

  const handleAdd = () => {
    if (frequencyType === 'custom_days' && frequencyDays.length === 0) {
      alert("Please select at least one day for custom frequency.");
      return;
    }
    if (expectedSessions === 0) {
      alert("Selected dates and frequency result in 0 sessions.");
      return;
    }

    const config = {
      exercise_id: selectedExercise.id,
      exercise: selectedExercise, // Keep full obj locally for UI
      sets: parseInt(sets),
      reps: parseInt(reps),
      sessions_per_day: parseInt(sessionsPerDay),
      frequency_type: frequencyType,
      frequency_days: frequencyType === 'custom_days' ? frequencyDays : null,
      start_date: startDate,
      end_date: endDate,
      notes
    };

    onAdd(config);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
             {step === 2 && (
               <button onClick={() => setStep(1)} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
                 <ChevronLeft className="w-5 h-5" />
               </button>
             )}
             <h2 className="text-xl font-extrabold text-heading">
               {step === 1 ? 'Add Exercise' : `Configure: ${selectedExercise?.name}`}
             </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Step 1: Search */}
        {step === 1 && (
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="relative mb-6">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search exercises by name or body part..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
              />
            </div>

            {loadingSearch ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : exercises.length === 0 ? (
              <div className="text-center p-8 text-gray-500 font-medium">No exercises found.</div>
            ) : (
              <div className="space-y-2">
                {exercises.map(ex => (
                  <div key={ex.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => handleSelect(ex)}>
                    <div>
                      <h4 className="font-bold text-dark">{ex.name}</h4>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">Target: {ex.target_body_part}</p>
                    </div>
                    <button className="text-primary font-bold text-sm bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm">
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Step 2: Configure */}
        {step === 2 && (
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
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
                  placeholder="e.g. Keep chin level, don't tilt head"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 font-medium min-h-[80px]"
                ></textarea>
             </div>
             
             <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-center justify-between">
                <span className="font-bold text-primary">Expected Total Sessions:</span>
                <span className="text-2xl font-extrabold text-primary">{expectedSessions}</span>
             </div>
          </div>
        )}

        {/* Footer */}
        {step === 2 && (
          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleAdd}
              className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-dark transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add to Plan
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AddExerciseModal;
