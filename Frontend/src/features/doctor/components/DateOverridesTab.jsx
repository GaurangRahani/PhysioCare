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
  const today = new Date().toISOString().split('T')[0];
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 365);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  const specificDates = rules?.specific_dates || {};
  // Sort dates chronologically for display
  const sortedDates = Object.keys(specificDates).sort((a, b) => a.localeCompare(b));

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
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-heading flex items-center gap-2">
            <CalendarX2 className="w-5 h-5 text-primary" />
            Date Overrides
          </h3>
          <p className="text-sm text-body mt-1">
            Mark specific dates as leave or give them different hours from your weekly routine.
          </p>
        </div>
        {!showForm && (
          <button 
            onClick={handleOpenForm}
            className="shrink-0 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Mark a Date
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
          <h4 className="font-semibold text-dark mb-4">Mark a Date</h4>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-heading mb-1">Date</label>
              <input
                type="date"
                min={today}
                max={maxDate}
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-primary focus:border-primary outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-heading mb-2">Type</label>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="override_type"
                    checked={formType === 'leave'}
                    onChange={() => setFormType('leave')}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-sm font-medium text-dark">Full Day Off / Leave</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="override_type"
                    checked={formType === 'hours'}
                    onChange={() => setFormType('hours')}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-sm font-medium text-dark">Special Hours (different from weekly routine)</span>
                </label>
              </div>
            </div>

            {formType === 'hours' && (
              <div className="pl-6 border-l-2 border-primary/20 space-y-3">
                {formShifts.map((shift, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="time"
                      value={shift.start}
                      onChange={(e) => updateShift(idx, 'start', e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-primary focus:border-primary outline-none"
                    />
                    <span className="text-body text-sm">to</span>
                    <input
                      type="time"
                      value={shift.end}
                      onChange={(e) => updateShift(idx, 'end', e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-primary focus:border-primary outline-none"
                    />
                    {formShifts.length > 1 && (
                      <button
                        onClick={() => removeShift(idx)}
                        className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addShift}
                  className="text-sm text-primary font-medium flex items-center gap-1 hover:text-dark transition-colors pt-1"
                >
                  <Plus className="w-4 h-4" /> Add another block
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="text-sm text-danger mt-2">{errorMsg}</div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveOverride}
                disabled={loading}
                className="px-5 py-2 bg-primary text-white font-medium text-sm rounded-lg hover:bg-dark transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Override
              </button>
              <button
                onClick={handleCloseForm}
                disabled={loading}
                className="px-5 py-2 border border-gray-200 text-dark font-medium text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List of existing overrides */}
      <div>
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Upcoming Overrides</h4>
        
        {sortedDates.length === 0 ? (
          <p className="text-sm text-body italic">No specific date overrides set.</p>
        ) : (
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {sortedDates.map(dateKey => {
              const shifts = specificDates[dateKey];
              const isPast = dateKey < today;
              
              return (
                <div key={dateKey} className={`flex items-center justify-between p-4 ${isPast ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                    <span className="font-semibold text-dark w-28">
                      {formatDateDisplay(dateKey)}
                    </span>
                    
                    {shifts.length === 0 ? (
                      <span className="text-sm font-medium text-danger bg-red-50 px-2.5 py-1 rounded-md">
                        Full Day Leave
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                          Special Hours
                        </span>
                        {shifts.map((s, i) => (
                          <span key={i} className="text-sm text-body">
                            {s.start} to {s.end}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDeleteOverride(dateKey)}
                    className="p-2 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove override"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10 text-sm text-body">
        <span className="font-semibold text-primary">Note:</span> The system checks specific dates first. 
        If a date is listed here, it overrides the weekly routine for that day entirely.
      </div>
      
    </div>
  );
};

export default DateOverridesTab;
