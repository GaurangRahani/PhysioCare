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
    <div className="animate-fade-in">
      
      {/* Slot Duration */}
      <h3><i className="fa-regular fa-clock" style={{ color: 'var(--secondary)', marginRight: '8px' }}></i> Slot Duration</h3>
      <p style={{ fontSize: '0.95rem', color: 'var(--gray-800)' }}>
        Changing slot duration affects all future bookings. Existing appointments are not affected.
      </p>
      
      <div className="radio-group">
        {SLOT_OPTIONS.map((min) => (
          <label key={min} className="radio-label">
            <input
              type="radio"
              name="slot_minutes"
              value={min}
              checked={slotMinutes === min}
              onChange={() => handleSlotChange(min)}
            />
            {min} min
          </label>
        ))}
      </div>

      <h3 style={{ margin: '2.5rem 0 1rem 0', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--gray-400)' }}>
        Weekly Schedule
      </h3>

      {/* Weekly Schedule */}
      <div>
        {DAYS_OF_WEEK.map((day) => {
          const shifts = routine[day.value] || [];
          const isActive = shifts.length > 0;

          return (
            <div key={day.value} className="schedule-row">
              <div className={`day-label ${!isActive ? 'off' : ''}`}>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={() => handleDayToggle(day.value)}
                  />
                  <span className="slider"></span>
                </label>
                {day.label}
              </div>

              <div className="time-blocks">
                {!isActive ? (
                  <span style={{ color: 'var(--gray-400)', marginTop: '0.5rem', display: 'block', fontWeight: '600' }}>Off</span>
                ) : (
                  <>
                    {shifts.map((shift, idx) => (
                      <div key={idx} className="time-inputs">
                        <div className="time-input-wrap">
                          <input
                            type="time"
                            value={shift.start}
                            onChange={(e) => updateShift(day.value, idx, 'start', e.target.value)}
                          />
                          <i className="fa-regular fa-clock"></i>
                        </div>
                        <span>to</span>
                        <div className="time-input-wrap">
                          <input
                            type="time"
                            value={shift.end}
                            onChange={(e) => updateShift(day.value, idx, 'end', e.target.value)}
                          />
                          <i className="fa-regular fa-clock"></i>
                        </div>
                        <button
                          onClick={() => removeShift(day.value, idx)}
                          className="btn-icon"
                          title="Remove Block"
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addShift(day.value)}
                      className="add-link"
                    >
                      + Add Hours Block
                    </button>
                  </>
                )}
              </div>
              <div></div>
            </div>
          );
        })}
      </div>

      {errorMsg && (
        <div style={{ padding: '1rem', color: 'var(--danger)', backgroundColor: 'rgba(247, 43, 80, 0.1)', borderRadius: '8px', marginTop: '1rem' }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '1rem', color: 'var(--success)', backgroundColor: 'rgba(32, 159, 132, 0.1)', borderRadius: '8px', marginTop: '1rem' }}>
          {successMsg}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" style={{ marginRight: '8px' }} /> : null}
          Save Weekly Routine <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8rem', marginLeft: '4px' }}></i>
        </button>
      </div>
      
    </div>
  );
};

export default WeeklyRoutineTab;
