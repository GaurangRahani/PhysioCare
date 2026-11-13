import React, { useState } from 'react';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  CalendarX2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Calendar,
  AlertCircle 
} from 'lucide-react';

const DateOverridesTab = ({ rules, onUpdate, getToken }) => {
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState('leave'); // 'leave' or 'hours'
  const [formShifts, setFormShifts] = useState([{ start: '09:00', end: '17:00' }]);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Date constraints
  const today = new Date().toLocaleDateString('en-CA');

  const specificDates = rules?.specific_dates || {};
  // Sort dates chronologically for display
  const sortedDates = Object.keys(specificDates)
    .filter(dateKey => dateKey >= today)
    .sort((a, b) => a.localeCompare(b));

  const handleOpenForm = () => {
    setShowForm(true);
    setFormDate(today);
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
    
    if (formDate < today) {
      handleCloseForm();
      return;
    }

    const shifts = formType === 'leave' ? [] : formShifts;

    if (formType === 'hours' && shifts.length === 0) {
      setErrorMsg('Please add at least one shift, or select Full Day Leave.');
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
        setErrorMsg(data.message || 'Failed to save date override.');
      }
    } catch (err) {
      console.error("Save date override error:", err);
      setErrorMsg('An error occurred while saving the override.');
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

  const formatDateDisplay = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-8 font-['Inter',system-ui,sans-serif] text-[#202223]">
      
      {/* ── 1. HEADER & ACTION BUTTON ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAEAEA]">
        <div>
          <h3 className="text-[15px] font-semibold text-[#202223] m-0 flex items-center gap-2">
            <CalendarX2 size={16} className="text-[#616161]" />
            <span>Specific Calendar Overrides & Leaves</span>
          </h3>
          <p className="text-[13px] text-[#616161] mt-1 font-normal">
            Mark holidays, clinical conferences, or custom hours for individual calendar dates.
          </p>
        </div>

        {!showForm && (
          <button 
            type="button"
            onClick={handleOpenForm} 
            className="btn-primary-saas shrink-0"
          >
            <Plus size={14} />
            <span>Mark a Date</span>
          </button>
        )}
      </div>

      {/* ── 2. ADD OVERRIDE FORM MODAL / PANEL ────────────────────── */}
      {showForm && (
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#EAEAEA]">
            <h4 className="text-[15px] font-semibold text-[#202223] m-0">
              Configure Date Override
            </h4>
            <span className="text-[12px] text-[#8A8A8A]">
              Selected: <strong className="text-[#202223] font-mono">{formDate || 'None'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left: Date Selection Mini-Calendar */}
            <div className="border border-[#E5E5E5] rounded-xl p-4 bg-[#FFFFFF]">
              <div className="flex items-center justify-between mb-3 text-[13px] font-medium">
                <button 
                  type="button" 
                  onClick={prevMonth} 
                  className="p-1 rounded hover:bg-[#F0F0F0] text-[#616161] transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[#202223] font-semibold">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  type="button" 
                  onClick={nextMonth} 
                  className="p-1 rounded hover:bg-[#F0F0F0] text-[#616161] transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#8A8A8A] mb-1">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-[12px]">
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} className="h-8" />;
                  
                  const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const yyyy = dateObj.getFullYear();
                  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const dd = String(dateObj.getDate()).padStart(2, '0');
                  const dateStr = `${yyyy}-${mm}-${dd}`;
                  
                  const isSelected = formDate === dateStr;
                  const isPast = dateStr < today;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleDateClick(day)}
                      className={`h-8 w-8 mx-auto rounded-lg flex items-center justify-center font-medium transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-[#111111] text-[#FFFFFF] shadow-xs' 
                          : isPast 
                          ? 'text-[#CCCCCC] cursor-not-allowed' 
                          : 'text-[#202223] hover:bg-[#F0F0F0]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Type and Hours */}
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A] block mb-2">
                  Override Type
                </label>
                
                <div className="flex flex-col gap-2">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formType === 'leave' 
                      ? 'border-[#111111] bg-[#FAFAFA]' 
                      : 'border-[#E5E5E5] hover:bg-[#F7F7F7]'
                  }`}>
                    <input
                      type="radio"
                      name="override_type"
                      checked={formType === 'leave'}
                      onChange={() => setFormType('leave')}
                      className="text-[#111111] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-[13px] font-medium text-[#202223] block">
                        Full Day Off / Leave
                      </span>
                      <span className="text-[11px] text-[#616161]">
                        No appointment slots will be computed or booked on this date.
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formType === 'hours' 
                      ? 'border-[#111111] bg-[#FAFAFA]' 
                      : 'border-[#E5E5E5] hover:bg-[#F7F7F7]'
                  }`}>
                    <input
                      type="radio"
                      name="override_type"
                      checked={formType === 'hours'}
                      onChange={() => setFormType('hours')}
                      className="text-[#111111] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-[13px] font-medium text-[#202223] block">
                        Custom Special Hours
                      </span>
                      <span className="text-[11px] text-[#616161]">
                        Override routine with specific clinical hours for this single date.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Special Hours Blocks */}
              {formType === 'hours' && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#EAEAEA]">
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                    Working Shifts
                  </span>
                  {formShifts.map((shift, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[13px]">
                      <input
                        type="time"
                        value={shift.start}
                        onChange={(e) => updateShift(idx, 'start', e.target.value)}
                        className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-2.5 py-1 text-[#202223] font-mono text-xs"
                      />
                      <span className="text-[#8A8A8A] text-xs">to</span>
                      <input
                        type="time"
                        value={shift.end}
                        onChange={(e) => updateShift(idx, 'end', e.target.value)}
                        className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-2.5 py-1 text-[#202223] font-mono text-xs"
                      />
                      {formShifts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeShift(idx)}
                          className="text-[#8A8A8A] hover:text-[#B42318] p-1 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addShift}
                    className="inline-flex items-center gap-1 text-[12px] text-[#2C5E91] hover:underline pt-1 w-fit"
                  >
                    <Plus size={12} />
                    <span>Add shift</span>
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="bg-[#FCE4E4] text-[#B42318] p-2.5 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={handleSaveOverride}
                  disabled={loading}
                  className="btn-primary-saas"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  <span>Save Override</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={loading}
                  className="btn-secondary-saas"
                >
                  Cancel
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── 3. LIST OF UPCOMING OVERRIDES ─────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h4 className="text-[13px] font-semibold uppercase tracking-wider text-[#8A8A8A] m-0">
          Upcoming Scheduled Overrides ({sortedDates.length})
        </h4>

        {sortedDates.length === 0 ? (
          <div className="p-8 text-center bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl flex flex-col items-center justify-center">
            <Calendar size={20} className="text-[#8A8A8A] mb-2" />
            <span className="text-[13px] font-medium text-[#202223]">No date overrides scheduled</span>
            <span className="text-[12px] text-[#8A8A8A] mt-0.5">
              Your weekly routine applies automatically to all upcoming dates.
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-[#E5E5E5] divide-y divide-[#EAEAEA] bg-[#FFFFFF] overflow-hidden">
            {sortedDates.map(dateKey => {
              const shifts = specificDates[dateKey];
              const isLeave = shifts.length === 0;

              return (
                <div 
                  key={dateKey} 
                  className="p-4 flex items-center justify-between gap-4 hover:bg-[#FAFAFA] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col items-center justify-center text-[#202223] shrink-0">
                      <span className="text-[10px] text-[#8A8A8A] uppercase font-bold leading-none">
                        {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-[14px] font-bold leading-tight font-mono">
                        {new Date(dateKey + 'T00:00:00').getDate()}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-[#202223]">
                        {formatDateDisplay(dateKey)}
                      </span>
                      <span className="text-[12px] text-[#616161] font-mono mt-0.5">
                        {isLeave ? 'Full Day Leave' : shifts.map(s => `${s.start} - ${s.end}`).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isLeave ? (
                      <span className="badge-semantic-error">
                        Leave / Closed
                      </span>
                    ) : (
                      <span className="badge-semantic-warning">
                        Custom Hours
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteOverride(dateKey)}
                      className="text-[#8A8A8A] hover:text-[#B42318] p-1.5 rounded hover:bg-[#FCE4E4]/40 transition-colors cursor-pointer"
                      title="Remove this date override"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 4. CONTEXTUAL NOTE ────────────────────────────────────── */}
      <div className="p-3.5 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-start gap-2.5 text-[12px] text-[#616161]">
        <Info size={16} className="text-[#8A8A8A] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#202223]">Priority Order:</span> Specific date overrides always take precedence over your recurring weekly blueprint.
        </div>
      </div>

    </div>
  );
};

export default DateOverridesTab;