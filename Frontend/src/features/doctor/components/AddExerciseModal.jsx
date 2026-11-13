import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Search, Loader2, X, ChevronLeft, Dumbbell, Plus } from 'lucide-react';
import { calculateExpectedSessions, encodeDays } from '../../../utils/scheduleUtils';

const AddExerciseModal = ({ isOpen, onClose, onAdd, defaultDates, currentExercises = [], onEditExisting }) => {
  const { getToken } = useAuth();
  const [step, setStep] = useState(1);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [frequencyType, setFrequencyType] = useState('daily');
  const [frequencyDays, setFrequencyDays] = useState([]);
  const [sessionsPerDay, setSessionsPerDay] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSearchQuery('');
      setSelectedExercise(null);
      setStartDate(defaultDates?.start || new Date().toLocaleDateString('en-CA'));
      setEndDate(defaultDates?.end || new Date().toLocaleDateString('en-CA'));
      setSets(3);
      setReps(10);
      setFrequencyType('daily');
      setFrequencyDays([]);
      setSessionsPerDay(1);
      setNotes('');
      fetchExercises('');
    }
  }, [isOpen, defaultDates]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isOpen && step === 1) fetchExercises(searchQuery);
    }, 250);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isOpen, step]);

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
        setExercises(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelect = (ex) => {
    const existingEntry = currentExercises.find(e => 
      (e.exercise_id === ex.id || e.exercise?.id === ex.id) && 
      e._localStatus !== 'discontinued'
    );
    
    if (existingEntry) {
      onClose();
      if (onEditExisting) onEditExisting(existingEntry);
      return;
    }
    
    setSelectedExercise(ex);
    setStep(2);
  };

  const handleCustomDayToggle = (dayIndex) => {
    setFrequencyDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const expectedSessions = startDate && endDate ? calculateExpectedSessions({
    start_date: startDate,
    end_date: endDate,
    frequency_type: frequencyType,
    frequency_days: frequencyType === 'custom_days' ? encodeDays(frequencyDays) : null,
    sessions_per_day: parseInt(sessionsPerDay, 10) || 1
  }) : 0;

  const handleAdd = () => {
    if (frequencyType === 'custom_days' && frequencyDays.length === 0) {
      alert("Please select at least one day for custom frequency.");
      return;
    }

    const config = {
      exercise_id: selectedExercise.id,
      exercise: selectedExercise,
      sets: parseInt(sets, 10) || 3,
      reps: parseInt(reps, 10) || 10,
      sessions_per_day: parseInt(sessionsPerDay, 10) || 1,
      frequency_type: frequencyType,
      frequency_days: frequencyType === 'custom_days' ? frequencyDays : null,
      start_date: startDate,
      end_date: endDate,
      notes
    };

    onAdd(config);
  };

  if (!isOpen) return null;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Inter',system-ui,sans-serif]">
      <div 
        className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E5] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button 
                type="button"
                onClick={() => setStep(1)} 
                className="p-1 rounded-md text-[#616161] hover:text-[#202223] hover:bg-[#F0F0F0] cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h3 className="text-[16px] font-semibold text-[#202223] m-0">
              {step === 1 ? 'Select Exercise from Catalog' : `Configure: ${selectedExercise?.name}`}
            </h3>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-[#616161] hover:text-[#202223] hover:bg-[#F0F0F0] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Search & Pick */}
        {step === 1 && (
          <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
              <input 
                type="text" 
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] focus:ring-1 focus:ring-[#202223] transition-all"
                placeholder="Search by exercise name or target body part..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {loadingSearch ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#8A8A8A]">
                <Loader2 size={20} className="animate-spin text-[#202223]" />
                <span className="text-[12px]">Searching library...</span>
              </div>
            ) : exercises.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-[#8A8A8A]">
                <Dumbbell size={22} className="mb-2 text-[#CCCCCC]" />
                <span className="text-[13px] font-medium text-[#202223]">No exercises found</span>
                <span className="text-[12px] text-[#616161] mt-0.5">Try searching for a different keyword</span>
              </div>
            ) : (
              <div className="divide-y divide-[#EAEAEA] border border-[#E5E5E5] rounded-xl overflow-hidden bg-[#FFFFFF]">
                {exercises.map(ex => (
                  <div 
                    key={ex.id} 
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#F9F9F9] transition-colors cursor-pointer"
                    onClick={() => handleSelect(ex)}
                  >
                    <div>
                      <h4 className="text-[14px] font-semibold text-[#202223] m-0">
                        {ex.name}
                      </h4>
                      <span className="badge-semantic-neutral text-[10px] mt-1 inline-block">
                        {ex.target_body_part || 'General'}
                      </span>
                    </div>

                    <button 
                      type="button" 
                      className="btn-secondary-saas text-[12px] py-1 px-3 shrink-0"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Configure Parameters */}
        {step === 2 && (
          <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
            {/* Sets & Reps */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-[#202223] block mb-1">Sets</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] font-mono"
                  value={sets} 
                  onChange={e => setSets(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#202223] block mb-1">Reps</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100"
                  className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] font-mono"
                  value={reps} 
                  onChange={e => setReps(e.target.value)} 
                />
              </div>
            </div>

            {/* Frequency & Sessions per day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-[#202223] block mb-1">Frequency</label>
                <select 
                  className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223]"
                  value={frequencyType} 
                  onChange={e => setFrequencyType(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="alternate_days">Alternate Days</option>
                  <option value="mon_wed_fri">Mon / Wed / Fri</option>
                  <option value="tue_thu_sat">Tue / Thu / Sat</option>
                  <option value="custom_days">Custom Specific Days</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#202223] block mb-1">Daily Sessions</label>
                <select 
                  className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223]"
                  value={sessionsPerDay} 
                  onChange={e => setSessionsPerDay(e.target.value)}
                >
                  <option value="1">1 time daily</option>
                  <option value="2">2 times daily</option>
                  <option value="3">3 times daily</option>
                </select>
              </div>
            </div>

            {/* Custom Day Chips */}
            {frequencyType === 'custom_days' && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-1.5">
                  Select Days of Week
                </label>
                <div className="flex gap-1.5">
                  {daysOfWeek.map((d, i) => {
                    const isSelected = frequencyDays.includes(i);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleCustomDayToggle(i)}
                        className={`flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#111111] text-[#FFFFFF]' 
                            : 'bg-[#F7F7F7] text-[#616161] hover:bg-[#EAEAEA]'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-medium text-[#202223] block mb-1">Start Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] font-mono"
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#202223] block mb-1">End Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] font-mono"
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[12px] font-medium text-[#202223] block mb-1">
                Clinical Prescription Notes (Optional)
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223]"
                placeholder="e.g. Stop immediately if pain exceeds 4/10; use ice pack after"
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
              />
            </div>

            {/* Expected Sessions Badge */}
            <div className="p-3 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl flex items-center justify-between text-[12px]">
              <span className="text-[#616161]">Expected Workout Sessions:</span>
              <span className="font-semibold text-[#202223] font-mono">
                {expectedSessions} sessions
              </span>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#EAEAEA] bg-[#FAFAFA]">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-secondary-saas"
          >
            Cancel
          </button>
          {step === 2 && (
            <button 
              type="button" 
              onClick={handleAdd} 
              className="btn-primary-saas flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add to Plan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddExerciseModal;
