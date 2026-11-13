import React, { useState } from 'react';
import { Loader2, Plus, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

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
    for (const [day, shifts] of Object.entries(routine)) {
      if (!shifts || shifts.length === 0) continue;
      
      const dayName = DAYS_OF_WEEK.find(d => String(d.value) === String(day))?.label || `Day ${day}`;
      const sorted = [...shifts].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].start >= sorted[i].end) {
          return `On ${dayName}, start time must be before end time (${sorted[i].start} - ${sorted[i].end})`;
        }
        if (i > 0 && sorted[i - 1].end > sorted[i].start) {
          return `Overlapping shifts detected on ${dayName} (${sorted[i - 1].end} overlaps with ${sorted[i].start})`;
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

      // 1. Save Slot Duration if modified
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

      // 2. Save each day's routine
      for (const day of DAYS_OF_WEEK) {
        const shifts = routine[day.value] || [];
        await fetch(`${apiUrl}/api/availability/weekly`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ day_of_week: day.value, shifts })
        });
      }

      // Re-fetch all rules to keep state in sync
      const res = await fetch(`${apiUrl}/api/availability`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        onUpdate(data.availability_rules);
        setSuccessMsg('Weekly consultation routine saved successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }

    } catch (err) {
      console.error("Save weekly routine error:", err);
      setErrorMsg('Failed to save weekly routine. Please verify network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 font-['Inter',system-ui,sans-serif] text-[#202223]">
      
      {/* ── 1. SLOT DURATION CONFIGURATION ─────────────────────────── */}
      <section className="flex flex-col gap-3 pb-6 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-[15px] font-semibold text-[#202223] m-0 flex items-center gap-2">
            <Clock size={16} className="text-[#616161]" />
            <span>Consultation Slot Duration</span>
          </h3>
          <p className="text-[13px] text-[#616161] mt-1 font-normal">
            Specifies the booking window per patient slot. Does not alter already confirmed appointments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          {SLOT_OPTIONS.map((min) => {
            const isSelected = slotMinutes === min;
            return (
              <button
                key={min}
                type="button"
                onClick={() => handleSlotChange(min)}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-[#111111] text-[#FFFFFF] border border-[#111111] shadow-xs' 
                    : 'bg-[#FFFFFF] text-[#202223] border border-[#E5E5E5] hover:bg-[#F0F0F0]'
                }`}
              >
                {min} minutes {min === 30 && <span className="text-[10px] opacity-75 font-normal ml-1">(Default)</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 2. WEEKLY RECURRING SHIFTS ─────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[#202223] m-0">
              Recurring Weekly Schedule
            </h3>
            <p className="text-[13px] text-[#616161] mt-0.5">
              Enable your working days and configure clinical hours.
            </p>
          </div>
          <span className="text-[12px] text-[#8A8A8A]">
            Auto-saves per doctor profile
          </span>
        </div>

        {/* Schedule Matrix */}
        <div className="rounded-xl border border-[#E5E5E5] divide-y divide-[#EAEAEA] overflow-hidden bg-[#FFFFFF]">
          {DAYS_OF_WEEK.map((day) => {
            const shifts = routine[day.value] || [];
            const isActive = shifts.length > 0;

            return (
              <div 
                key={day.value} 
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  !isActive ? 'bg-[#FCFCFC]' : 'bg-[#FFFFFF] hover:bg-[#FAFAFA]'
                }`}
              >
                {/* Day Toggle & Label */}
                <div className="flex items-center gap-3 w-40 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isActive ? 'bg-[#111111]' : 'bg-[#DCDCDC]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#FFFFFF] shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-[14px] font-medium ${isActive ? 'text-[#202223]' : 'text-[#8A8A8A]'}`}>
                    {day.label}
                  </span>
                </div>

                {/* Shifts Blocks */}
                <div className="flex-1">
                  {!isActive ? (
                    <span className="badge-semantic-neutral">
                      Off / Clinic Closed
                    </span>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {shifts.map((shift, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-wrap text-[13px]">
                          <div className="flex items-center bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-2.5 py-1 focus-within:border-[#202223]">
                            <input
                              type="time"
                              value={shift.start}
                              onChange={(e) => updateShift(day.value, idx, 'start', e.target.value)}
                              className="bg-transparent border-none outline-none text-[#202223] font-mono text-[13px] cursor-pointer"
                            />
                          </div>

                          <span className="text-[#8A8A8A] text-[12px] font-medium">to</span>

                          <div className="flex items-center bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-2.5 py-1 focus-within:border-[#202223]">
                            <input
                              type="time"
                              value={shift.end}
                              onChange={(e) => updateShift(day.value, idx, 'end', e.target.value)}
                              className="bg-transparent border-none outline-none text-[#202223] font-mono text-[13px] cursor-pointer"
                            />
                          </div>

                          {shifts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeShift(day.value, idx)}
                              className="text-[#8A8A8A] hover:text-[#B42318] p-1.5 rounded hover:bg-[#FCE4E4]/40 transition-colors"
                              title="Delete this block"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}

                      <div>
                        <button
                          type="button"
                          onClick={() => addShift(day.value)}
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2C5E91] hover:underline pt-1 cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Add another block</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. FEEDBACK NOTICES ────────────────────────────────────── */}
      {errorMsg && (
        <div className="bg-[#FCE4E4] text-[#B42318] p-3.5 rounded-xl text-xs flex items-center gap-2 border border-[#E5E5E5]">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-[#D9F7C3] text-[#245B19] p-3.5 rounded-xl text-xs flex items-center gap-2 border border-[#E5E5E5]">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── 4. SUBMIT ACTION ────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-3 border-t border-[#EAEAEA]">
        <span className="text-[12px] text-[#8A8A8A]">
          Changes immediately update patient self-booking options.
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="btn-primary-saas"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Saving Routine...</span>
            </>
          ) : (
            <span>Save Weekly Routine</span>
          )}
        </button>
      </div>

    </div>
  );
};

export default WeeklyRoutineTab;