import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const EditExerciseModal = ({ isOpen, onClose, exercise, onUpdate }) => {
  const [sets, setSets] = useState(exercise?.sets || 3);
  const [reps, setReps] = useState(exercise?.reps || 10);
  const [frequencyType, setFrequencyType] = useState(exercise?.frequency_type || 'daily');
  const [frequencyDays, setFrequencyDays] = useState(
    Array.isArray(exercise?.frequency_days) ? exercise.frequency_days : [] 
  );
  const [sessionsPerDay, setSessionsPerDay] = useState(exercise?.sessions_per_day || 1);
  const [endDate, setEndDate] = useState(exercise?.end_date?.substring(0, 10) || new Date().toLocaleDateString('en-CA'));
  const [notes, setNotes] = useState(exercise?.notes || '');

  useEffect(() => {
    if (isOpen && exercise) {
      setSets(exercise.sets || 3);
      setReps(exercise.reps || 10);
      setFrequencyType(exercise.frequency_type || 'daily');
      
      if (exercise.frequency_type === 'custom_days' && Array.isArray(exercise.frequency_days)) {
         setFrequencyDays(exercise.frequency_days);
      } else {
         setFrequencyDays([]);
      }
      
      setSessionsPerDay(exercise.sessions_per_day || 1);
      setEndDate(exercise.end_date ? exercise.end_date.substring(0, 10) : new Date().toLocaleDateString('en-CA'));
      setNotes(exercise.notes || '');
    }
  }, [isOpen, exercise]);

  const handleCustomDayToggle = (dayIndex) => {
    setFrequencyDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleSave = () => {
    if (frequencyType === 'custom_days' && frequencyDays.length === 0) {
      alert("Please select at least one day for custom frequency.");
      return;
    }

    const payload = {
      sets: parseInt(sets, 10) || 3,
      reps: parseInt(reps, 10) || 10,
      sessions_per_day: parseInt(sessionsPerDay, 10) || 1,
      frequency_type: frequencyType,
      frequency_days: frequencyType === 'custom_days' ? frequencyDays : null,
      end_date: endDate,
      notes
    };

    onUpdate({ ...exercise, ...payload });
  };

  if (!isOpen) return null;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const exerciseName = exercise?.exercise?.name || exercise?.name || 'Exercise';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Inter',system-ui,sans-serif]">
      <div 
        className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E5] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-[#FAFAFA]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
              Modify Prescription
            </span>
            <h3 className="text-[16px] font-semibold text-[#202223] m-0">
              {exerciseName}
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

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
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

          {/* End Date */}
          <div>
            <label className="text-[12px] font-medium text-[#202223] block mb-1">Target End Date</label>
            <input 
              type="date" 
              className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223] font-mono"
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[12px] font-medium text-[#202223] block mb-1">
              Clinical Prescription Notes
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-1.5 text-[13px] text-[#202223] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg outline-none focus:border-[#202223]"
              placeholder="e.g. Increase hold duration by 2 seconds if comfortable"
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#EAEAEA] bg-[#FAFAFA]">
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-secondary-saas"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="btn-primary-saas flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Update Exercise</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExerciseModal;
