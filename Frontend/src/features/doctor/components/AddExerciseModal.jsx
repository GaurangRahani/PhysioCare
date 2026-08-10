import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
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
    if (expectedSessions === 0) {
      alert("Selected dates and frequency result in 0 sessions.");
      return;
    }

    const config = {
      exercise_id: selectedExercise.id,
      exercise: selectedExercise,
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

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="modal-overlay">
        <div className="modal-card" style={step === 1 ? { maxWidth: '600px' } : {}}>
            
            <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {step === 2 && (
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <i className="fa-solid fa-chevron-left" style={{ fontSize: '1.2rem', color: 'var(--gray-500)' }}></i>
                        </button>
                    )}
                    <h3>{step === 1 ? 'Add Exercise' : `Configure: ${selectedExercise?.name}`}</h3>
                </div>
                <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
            </div>

            {step === 1 && (
                <div className="modal-body">
                    <div className="form-group" style={{ position: 'relative' }}>
                        <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--gray-400)' }}></i>
                        <input 
                            type="text" 
                            className="form-control" 
                            style={{ paddingLeft: '2.5rem' }} 
                            placeholder="Search exercises by name or body part..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {loadingSearch ? (
                        <div className="empty-state">
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                        </div>
                    ) : exercises.length === 0 ? (
                        <div className="empty-state">No exercises found.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {exercises.map(ex => (
                                <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--gray-200)', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleSelect(ex)}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--dark-brand)', marginBottom: '0.2rem' }}>{ex.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Target: {ex.target_body_part}</div>
                                    </div>
                                    <button className="btn-outline" style={{ padding: '0.4rem 1rem' }}>Select</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {step === 2 && (
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

                    <div className="form-group">
                        <label className="form-label">Notes for Patient (Optional)</label>
                        <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="e.g. Keep chin level, don't tilt head" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                    </div>

                    <div className="alert-warning" style={{ backgroundColor: 'rgba(86, 90, 207, 0.05)', borderColor: 'rgba(86, 90, 207, 0.15)', marginTop: 0, alignItems: 'center', justifyContent: 'space-between' }}>
                        <div><strong style={{ color: 'var(--primary)' }}>Expected Total Sessions:</strong></div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{expectedSessions}</div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="modal-footer">
                    <button className="btn-outline" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleAdd}>
                        <i className="fa-solid fa-plus"></i> Add to Plan
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default AddExerciseModal;
