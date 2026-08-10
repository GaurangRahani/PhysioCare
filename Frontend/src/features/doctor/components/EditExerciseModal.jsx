import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

const EditExerciseModal = ({ isOpen, onClose, exercise, mode, onUpdate }) => {
  const { getToken } = useAuth();
  
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

    onUpdate({ ...exercise, ...payload });
  };

  if (!isOpen) return null;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="modal-overlay">
        <div className="modal-card">
            
            <div className="modal-header">
                <h3>Edit: {exercise?.exercise?.name || exercise?.name || 'Exercise'}</h3>
                <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
            </div>

            <div className="modal-body">
                <div className="grid-2 form-group">
                    <div>
                        <label className="form-label">Sets</label>
                        <input type="number" min="1" className="form-control" value={sets} onChange={e => setSets(e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">Reps</label>
                        <input type="number" min="1" className="form-control" value={reps} onChange={e => setReps(e.target.value)} />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Frequency</label>
                    <select className="form-control" value={frequencyType} onChange={e => setFrequencyType(e.target.value)}>
                        <option value="daily">Daily</option>
                        <option value="alternate_days">Alternate Days</option>
                        <option value="mon_wed_fri">Mon / Wed / Fri</option>
                        <option value="tue_thu_sat">Tue / Thu / Sat</option>
                        <option value="custom_days">Custom Days</option>
                    </select>
                </div>

                {frequencyType === 'custom_days' && (
                  <div className="form-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {daysOfWeek.map((d, i) => (
                      <button
                        key={d}
                        onClick={() => handleCustomDayToggle(i)}
                        className={frequencyDays.includes(i) ? 'badge-purple' : 'btn-outline'}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}

                <div className="form-group">
                    <label className="form-label">Sessions Per Day</label>
                    <select className="form-control" value={sessionsPerDay} onChange={e => setSessionsPerDay(e.target.value)}>
                        <option value="1">1x per day</option>
                        <option value="2">2x per day</option>
                        <option value="3">3x per day</option>
                    </select>
                </div>
                
                {mode === 'modify' && (
                  <div className="form-group">
                    <label className="form-label">End Date for this exercise</label>
                    <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Notes for Patient (Optional)</label>
                    <textarea className="form-control" style={{ minHeight: '80px' }} value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                </div>

                {mode === 'modify' && (
                  <div className="alert-warning">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                      <div>
                          <strong>Note:</strong> Changing frequency or dates updates the patient's schedule from today onward. Past compliance history is preserved.
                      </div>
                  </div>
                )}
            </div>

            <div className="modal-footer">
                <button className="btn-outline" onClick={onClose}>Cancel</button>
                <button className="btn-primary" onClick={handleSave}>
                    <i className="fa-regular fa-floppy-disk"></i> Save Changes
                </button>
            </div>
        </div>
    </div>
  );
};

export default EditExerciseModal;
