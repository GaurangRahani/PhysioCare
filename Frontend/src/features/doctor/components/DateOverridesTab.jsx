import React, { useState } from 'react';
import { Loader2, Plus, Trash2, CalendarX2 } from 'lucide-react';

const DateOverridesTab = ({ rules, onUpdate, getToken }) => {
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState('leave'); // 'leave' or 'hours'
  const [formShifts, setFormShifts] = useState([{ start: '09:00', end: '17:00' }]);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Date constraints
  const today = new Date().toLocaleDateString('en-CA');
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 365);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  const specificDates = rules?.specific_dates || {};
  // Sort dates chronologically for display
  const sortedDates = Object.keys(specificDates)
    .filter(dateKey => dateKey >= today)
    .sort((a, b) => a.localeCompare(b));

  const handleOpenForm = () => {
    setShowForm(true);
    setFormDate('');
    setFormType('leave');
    setFormShifts([{ start: '09:00', end: '17:00' }]);
    setErrorMsg('');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setErrorMsg('');
  };

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Generate calendar grid
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handleDateClick = (day) => {
    if (!day) return;
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    // Don't allow selecting past dates
    if (dateStr < today) return;
    
    setFormDate(dateStr);
  };

  const addShift = () => {
    setFormShifts([...formShifts, { start: '09:00', end: '17:00' }]);
  };

  const updateShift = (index, field, value) => {
    const newShifts = [...formShifts];
    newShifts[index][field] = value;
    setFormShifts(newShifts);
  };

  const removeShift = (index) => {
    const newShifts = [...formShifts];
    newShifts.splice(index, 1);
    setFormShifts(newShifts);
  };

  const handleSaveOverride = async () => {
    setErrorMsg('');
    if (!formDate) {
      setErrorMsg('Please select a date.');
      return;
    }
    
    // Client-side ignore if past date
    if (formDate < today) {
      // Just silently close as requested in PRD
      handleCloseForm();
      return;
    }

    const shifts = formType === 'leave' ? [] : formShifts;

    // Validate shifts if not leave
    if (formType === 'hours' && shifts.length === 0) {
      setErrorMsg('Please add at least one hours block, or select Full Day Off.');
      return;
    }
    
    if (formType === 'hours') {
      const sorted = [...shifts].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].start >= sorted[i].end) {
          setErrorMsg(`Start time must be before end time (${sorted[i].start} - ${sorted[i].end})`);
          return;
        }
        if (i > 0 && sorted[i - 1].end > sorted[i].start) {
          setErrorMsg(`Overlapping shifts detected (${sorted[i - 1].end} overlaps with ${sorted[i].start})`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/availability/specific-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ date: formDate, shifts })
      });
      
      const data = await res.json();
      if (data.success) {
        onUpdate(data.availability_rules);
        handleCloseForm();
      } else {
        setErrorMsg(data.message || 'Failed to save override');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOverride = async (dateKey) => {
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/availability/specific-date/${dateKey}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (data.success) {
        onUpdate(data.availability_rules);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format date nicely (e.g. 25 Jun 2026)
  const formatDateDisplay = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="animate-fade-in">
      
      <div className="flex-between">
        <div>
          <h3><i className="fa-regular fa-calendar-xmark" style={{ color: 'var(--secondary)', marginRight: '8px' }}></i> Date Overrides</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--gray-800)' }}>
            Mark specific dates as leave or give them different hours from your weekly routine.
          </p>
        </div>
        {!showForm && (
          <button onClick={handleOpenForm} className="btn btn-outline">
            + Mark a Date
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ backgroundColor: 'var(--gray-100)', border: '1px solid var(--gray-200)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ fontFamily: 'var(--font-secondary)', fontWeight: 600, color: 'var(--dark-brand)', marginBottom: '1.5rem' }}>Mark a Date</h4>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>Date</label>
              <div className="preview-card" style={{ maxWidth: '350px' }}>
                <div className="cal-header">
                  <button onClick={prevMonth} aria-label="Previous Month" className="btn-icon">
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <span style={{ fontWeight: 600, color: 'var(--dark-brand)' }}>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={nextMonth} aria-label="Next Month" className="btn-icon">
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
                
                <div className="cal-grid" style={{ padding: '0.5rem 0' }}>
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                    <div key={d} className="cal-day-name">{d}</div>
                  ))}
                  
                  {calendarDays.map((day, idx) => {
                    if (!day) return <div key={idx} className="cal-date"></div>;
                    
                    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const yyyy = dateObj.getFullYear();
                    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const dd = String(dateObj.getDate()).padStart(2, '0');
                    const dateStr = `${yyyy}-${mm}-${dd}`;
                    
                    const isSelected = formDate === dateStr;
                    const isPast = dateStr < today;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleDateClick(day)}
                        className={`cal-date ${!isPast ? 'active-month' : ''} ${isSelected ? 'selected' : ''}`}
                        style={{ opacity: isPast ? 0.6 : 1, cursor: isPast ? 'not-allowed' : 'pointer' }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '1rem' }}>Type</label>
                <div className="radio-group" style={{ flexDirection: 'column', gap: '1rem', marginTop: 0 }}>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="override_type"
                      checked={formType === 'leave'}
                      onChange={() => setFormType('leave')}
                    />
                    Full Day Off / Leave
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="override_type"
                      checked={formType === 'hours'}
                      onChange={() => setFormType('hours')}
                    />
                    Special Hours (different from weekly routine)
                  </label>
                </div>
              </div>

              {formType === 'hours' && (
                <div style={{ paddingLeft: '1.5rem', borderLeft: '2px solid rgba(86, 90, 207, 0.2)', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                  {formShifts.map((shift, idx) => (
                    <div key={idx} className="time-inputs">
                      <div className="time-input-wrap">
                        <input
                          type="time"
                          value={shift.start}
                          onChange={(e) => updateShift(idx, 'start', e.target.value)}
                        />
                        <i className="fa-regular fa-clock"></i>
                      </div>
                      <span>to</span>
                      <div className="time-input-wrap">
                        <input
                          type="time"
                          value={shift.end}
                          onChange={(e) => updateShift(idx, 'end', e.target.value)}
                        />
                        <i className="fa-regular fa-clock"></i>
                      </div>
                      {formShifts.length > 1 && (
                        <button
                          onClick={() => removeShift(idx)}
                          className="btn-icon"
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addShift}
                    className="add-link"
                  >
                    + Add another block
                  </button>
                </div>
              )}

              {errorMsg && (
                <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{errorMsg}</div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-start' }}>
                <button
                  onClick={handleSaveOverride}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" style={{ marginRight: '8px' }} />}
                  Save Override
                </button>
                <button
                  onClick={handleCloseForm}
                  disabled={loading}
                  className="btn"
                  style={{ backgroundColor: 'transparent', border: '1px solid var(--gray-300)', color: 'var(--text-body)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List of existing overrides */}
      <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '1px', color: 'var(--gray-400)', marginTop: '1.5rem' }}>
        Upcoming Overrides
      </h3>
      
      <div className="override-list">
        {sortedDates.length === 0 ? (
          <p style={{ fontSize: '0.95rem', color: 'var(--gray-400)', fontStyle: 'italic', padding: '1.25rem 0' }}>No specific date overrides set.</p>
        ) : (
          sortedDates.map(dateKey => {
            const shifts = specificDates[dateKey];
            const isPast = dateKey < today;
            
            return (
              <div key={dateKey} className="override-item" style={{ opacity: isPast ? 0.5 : 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div className="override-date" style={{ marginBottom: 0 }}>{formatDateDisplay(dateKey)}</div>
                  {shifts.length > 0 && (
                    <div style={{ color: 'var(--text-body)', fontSize: '0.95rem' }}>
                      {shifts.map((s, i) => (
                        <span key={i} style={{ display: 'block' }}>
                          {s.start} to {s.end}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: '2rem' }}>
                  {shifts.length === 0 ? (
                    <span className="badge badge-leave" style={{ marginBottom: 0 }}>Full Day Leave</span>
                  ) : (
                    <span className="badge badge-special" style={{ marginBottom: 0 }}>Special Hours</span>
                  )}
                </div>
                
                <button
                  onClick={() => handleDeleteOverride(dateKey)}
                  className="btn-icon"
                  style={{ color: 'var(--danger)' }}
                  title="Remove override"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="alert-box">
        <i className="fa-solid fa-circle-info fa-lg"></i>
        <div>
          <strong style={{ color: 'var(--dark-brand)' }}>Note:</strong> The system checks specific dates first. 
          If a date is listed here, it overrides the weekly routine for that day entirely.
        </div>
      </div>
      
    </div>
  );
};

export default DateOverridesTab;
