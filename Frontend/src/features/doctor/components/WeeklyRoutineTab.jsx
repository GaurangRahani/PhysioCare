import React, { useState } from 'react';
import { Loader2, Plus, Trash2, Clock } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const SLOT_OPTIONS = [15, 30, 45, 60];

const WeeklyRoutineTab = ({ rules, onUpdate, getToken }) => {
  const [slotMinutes, setSlotMinutes] = useState(rules?.slot_minutes || 30);
  const [routine, setRoutine] = useState(rules?.weekly_routine || {});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSlotChange = (minutes) => {
    setSlotMinutes(minutes);
  };

  const handleDayToggle = (dayValue) => {
    const isCurrentlyActive = !!routine[dayValue] && routine[dayValue].length > 0;
    const newRoutine = { ...routine };
    
    if (isCurrentlyActive) {
      newRoutine[dayValue] = [];
    } else {
      newRoutine[dayValue] = [{ start: '09:00', end: '17:00' }];
    }
    setRoutine(newRoutine);
  };

  const addShift = (dayValue) => {
    const newRoutine = { ...routine };
    if (!newRoutine[dayValue]) newRoutine[dayValue] = [];
    newRoutine[dayValue].push({ start: '09:00', end: '17:00' });
    setRoutine(newRoutine);
  };

  const updateShift = (dayValue, index, field, value) => {
    const newRoutine = { ...routine };
    newRoutine[dayValue][index][field] = value;
    setRoutine(newRoutine);
  };

  const removeShift = (dayValue, index) => {
    const newRoutine = { ...routine };
    newRoutine[dayValue].splice(index, 1);
    setRoutine(newRoutine);
  };

  const validateShifts = () => {
    // Basic validation: end > start, no overlaps
    for (const [day, shifts] of Object.entries(routine)) {
      if (!shifts || shifts.length === 0) continue;
      
      const sorted = [...shifts].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].start >= sorted[i].end) {
          return `On day ${day}, start time must be before end time (${sorted[i].start} - ${sorted[i].end})`;
        }
        if (i > 0 && sorted[i - 1].end > sorted[i].start) {
          return `Overlapping shifts detected on day ${day} (${sorted[i - 1].end} overlaps with ${sorted[i].start})`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    const validationError = validateShifts();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // 1. Save Slot Duration
      if (slotMinutes !== rules?.slot_minutes) {
        await fetch(`${apiUrl}/api/availability/slot-duration`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ slot_minutes: slotMinutes })
        });
      }

      // 2. Save each day's routine iteratively
      for (const day of DAYS_OF_WEEK) {
        const shifts = routine[day.value] || [];
        // Only update if it changed from the initial rules (simplified approach: just send all)
        await fetch(`${apiUrl}/api/availability/weekly`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ day_of_week: day.value, shifts })
        });
      }

      // Re-fetch all rules to keep state perfectly in sync
      const res = await fetch(`${apiUrl}/api/availability`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        onUpdate(data.availability_rules);
        setSuccessMsg('Weekly routine saved successfully!');
      }

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save weekly routine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Slot Duration */}
      <div>
        <h3 className="text-lg font-semibold text-heading flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Slot Duration
        </h3>
        <p className="text-sm text-body mt-1 mb-4">
          Changing slot duration affects all future bookings. Existing appointments are not affected.
        </p>
        <div className="flex gap-4">
          {SLOT_OPTIONS.map((min) => (
            <label key={min} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="slot_minutes"
                checked={slotMinutes === min}
                onChange={() => handleSlotChange(min)}
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
              />
              <span className="text-sm font-medium text-dark">{min} min</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Weekly Schedule */}
      <div>
        <h3 className="text-lg font-semibold text-heading mb-4">WEEKLY SCHEDULE</h3>
        
        <div className="space-y-6">
          {DAYS_OF_WEEK.map((day) => {
            const shifts = routine[day.value] || [];
            const isActive = shifts.length > 0;

            return (
              <div key={day.value} className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Day Header */}
                <div className="w-40 flex items-center gap-3 mt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isActive}
                      onChange={() => handleDayToggle(day.value)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className={`font-medium ${isActive ? 'text-dark' : 'text-gray-400'}`}>
                    {day.label}
                  </span>
                </div>

                {/* Shifts Container */}
                <div className="flex-1 space-y-3">
                  {!isActive ? (
                    <span className="text-sm text-gray-400 inline-block mt-2">Off</span>
                  ) : (
                    <>
                      {shifts.map((shift, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <input
                            type="time"
                            value={shift.start}
                            onChange={(e) => updateShift(day.value, idx, 'start', e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-primary focus:border-primary outline-none"
                          />
                          <span className="text-body text-sm">to</span>
                          <input
                            type="time"
                            value={shift.end}
                            onChange={(e) => updateShift(day.value, idx, 'end', e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-primary focus:border-primary outline-none"
                          />
                          <button
                            onClick={() => removeShift(day.value, idx)}
                            className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded transition-colors ml-2"
                            title="Remove Block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => addShift(day.value)}
                        className="text-sm text-primary font-medium flex items-center gap-1 hover:text-dark transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Hours Block
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-sm text-danger bg-red-50 border border-red-100 rounded-lg">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg">
          {successMsg}
        </div>
      )}

      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full md:w-auto px-8 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-dark transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Weekly Routine
        </button>
      </div>
      
    </div>
  );
};

export default WeeklyRoutineTab;
