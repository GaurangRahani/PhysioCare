import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Loader2, ChevronLeft, ChevronRight, Info } from 'lucide-react';

const PreviewTab = ({ getToken }) => {
  const { user } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    if (selectedDate && user?.id) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, user?.id]);

  const fetchSlots = async (dateStr) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/availability/slots?doctor_id=me&date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots);
      } else {
        setErrorMsg(data.message || 'Failed to fetch slots.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred while fetching slots.');
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Generate calendar grid
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  // Adjust so Monday is 0
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
    // Format safely to YYYY-MM-DD local time
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="animate-fade-in">
      
      <div className="preview-grid">
        
        {/* Calendar Side */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Select Date</h3>
          <div className="preview-card">
            <div className="cal-header">
              <button onClick={prevMonth} aria-label="Previous Month">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button onClick={nextMonth} aria-label="Next Month">
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
            
            <div className="cal-grid">
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
                
                const isSelected = selectedDate === dateStr;
                const isPast = dateStr < new Date().toLocaleDateString('en-CA');

                return (
                  <div
                    key={idx}
                    onClick={() => handleDateClick(day)}
                    className={`cal-date ${!isPast ? 'active-month' : ''} ${isSelected ? 'selected' : ''}`}
                    style={{ opacity: isPast ? 0.5 : 1 }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="alert-box" style={{ marginTop: '1.5rem', backgroundColor: 'var(--gray-100)', borderLeftColor: 'var(--gray-300)' }}>
            <i className="fa-solid fa-circle-info" style={{ color: 'var(--gray-400)' }}></i>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-800)' }}>
              This preview calls the live production endpoint. What you see here is exactly the times patients and receptionists will be offered.
            </div>
          </div>
        </div>

        {/* Slots Side */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Availability Preview</h3>
          <div className="preview-card" style={{ borderTop: '4px solid var(--primary)', minHeight: '350px' }}>
            <div className="slots-header">{formatDateDisplay(selectedDate)}</div>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
            ) : errorMsg ? (
              <div style={{ color: 'var(--danger)', padding: '1rem', backgroundColor: 'rgba(247, 43, 80, 0.1)', borderRadius: '0.5rem', marginTop: '1rem' }}>
                {errorMsg}
              </div>
            ) : slots.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', textAlign: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', backgroundColor: 'var(--gray-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: 'var(--gray-400)', fontWeight: 700 }}>--</span>
                </div>
                <p style={{ color: 'var(--text-heading)', fontWeight: 600 }}>No Slots Available</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', marginTop: '0.25rem' }}>You are marked as off or on leave.</p>
              </div>
            ) : (
              <>
                <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                  <span style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 700 }}>{slots.length}</span> slots available today:
                </h4>
                
                <div className="time-grid">
                  {slots.map((time, idx) => (
                    <button key={idx} className="time-pill">
                      {time}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default PreviewTab;
