import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Loader2, ChevronLeft, ChevronRight, Info } from 'lucide-react';

const PreviewTab = ({ getToken }) => {
  const { user } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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
    <div className="flex flex-col md:flex-row gap-8 animate-fade-in">
      
      {/* Left: Calendar */}
      <div className="w-full md:w-1/2">
        <h3 className="text-lg font-semibold text-heading mb-4">Select Date</h3>
        
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 hover:bg-gray-50 rounded transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h4 className="font-medium text-dark">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h4>
            <button onClick={nextMonth} className="p-1 hover:bg-gray-50 rounded transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx} className="h-10"></div>;
              
              const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const yyyy = dateObj.getFullYear();
              const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
              const dd = String(dateObj.getDate()).padStart(2, '0');
              const dateStr = `${yyyy}-${mm}-${dd}`;
              
              const isSelected = selectedDate === dateStr;
              const isPast = dateStr < new Date().toISOString().split('T')[0];

              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(day)}
                  className={`h-10 rounded-lg flex items-center justify-center text-sm transition-colors ${
                    isSelected 
                      ? 'bg-primary text-white font-medium shadow-sm' 
                      : isPast
                        ? 'text-gray-300 hover:bg-gray-50'
                        : 'text-dark hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="mt-4 flex items-start gap-2 text-xs text-body bg-gray-50 p-3 rounded-lg border border-gray-100">
          <Info className="w-4 h-4 shrink-0 text-primary" />
          <p>
            This preview calls the live production endpoint. What you see here is exactly the times patients and receptionists will be offered.
          </p>
        </div>
      </div>

      {/* Right: Slots Display */}
      <div className="w-full md:w-1/2">
        <h3 className="text-lg font-semibold text-heading mb-4">Availability Preview</h3>
        
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 min-h-[300px]">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            {formatDateDisplay(selectedDate)}
          </p>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : errorMsg ? (
            <div className="text-sm text-danger p-3 bg-red-50 rounded-lg">{errorMsg}</div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-gray-400 font-bold">--</span>
              </div>
              <p className="text-dark font-medium">No Slots Available</p>
              <p className="text-sm text-body mt-1">You are marked as off or on leave.</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-body mb-4">
                <span className="font-semibold text-dark">{slots.length}</span> slots available today:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {slots.map((time, idx) => (
                  <div 
                    key={idx}
                    className="py-2 text-center bg-white border border-primary/20 text-primary font-medium text-sm rounded-lg shadow-sm"
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PreviewTab;
